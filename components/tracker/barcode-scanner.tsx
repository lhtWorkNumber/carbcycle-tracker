"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, LoaderCircle, ScanLine, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { type FoodItemSummary } from "@/lib/domain";

type DetectorResult = {
  rawValue: string;
};

const videoReadyState = 2;

interface BarcodeDetectorConstructor {
  new (options?: {
    formats?: string[];
  }): {
    detect: (source: HTMLVideoElement) => Promise<DetectorResult[]>;
  };
  getSupportedFormats?: () => Promise<string[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

export function BarcodeScanner({
  onFoodDetected
}: {
  onFoodDetected: (food: FoodItemSummary) => void;
}) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const scannerSessionRef = useRef(0);
  const isStartingRef = useRef(false);
  const isLookingUpRef = useRef(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  async function lookupBarcode(barcode: string) {
    const normalizedBarcode = barcode.trim();

    if (!normalizedBarcode || isLookingUpRef.current) {
      return;
    }

    isLookingUpRef.current = true;
    setLoadingLookup(true);
    setError(null);

    try {
      const response = await fetch(`/api/barcode/${encodeURIComponent(normalizedBarcode)}`);

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "条码识别失败");
      }

      const food = (await response.json()) as FoodItemSummary;
      onFoodDetected(food);
      toast({
        title: "条码识别成功",
        description: `${food.nameZh} 已自动填入营养信息。`,
        variant: "success"
      });
      closeScanner();
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "条码识别失败");
      toast({
        title: "条码识别失败",
        description: lookupError instanceof Error ? lookupError.message : "请手动输入条码重试。",
        variant: "error"
      });
    } finally {
      isLookingUpRef.current = false;
      setLoadingLookup(false);
    }
  }

  function stopScanner() {
    scannerSessionRef.current += 1;

    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    isStartingRef.current = false;
    setIsStarting(false);
    setIsScanning(false);
  }

  function closeScanner() {
    stopScanner();
    setIsOpen(false);
  }

  async function startScanner() {
    if (isStartingRef.current || loadingLookup) {
      return;
    }

    stopScanner();
    isStartingRef.current = true;
    setIsStarting(true);
    const scannerSession = scannerSessionRef.current + 1;
    scannerSessionRef.current = scannerSession;

    if (!window.BarcodeDetector) {
      setError("当前浏览器不支持实时扫码，请使用手动条码输入。");
      isStartingRef.current = false;
      setIsStarting(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("当前浏览器无法访问摄像头，请使用手动条码输入。");
      isStartingRef.current = false;
      setIsStarting(false);
      return;
    }

    try {
      setError(null);
      setIsOpen(true);

      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });

      if (scannerSessionRef.current !== scannerSession) {
        return;
      }

      if (!videoRef.current) {
        throw new Error("摄像头视图还没准备好，请重试。");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment"
          }
        }
      });

      if (scannerSessionRef.current !== scannerSession) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      if (scannerSessionRef.current !== scannerSession) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      isStartingRef.current = false;
      setIsStarting(false);
      setIsScanning(true);

      const supportedFormats =
        typeof window.BarcodeDetector.getSupportedFormats === "function"
          ? await window.BarcodeDetector.getSupportedFormats()
          : ["ean_13", "ean_8", "upc_a", "upc_e"];
      const formats = supportedFormats.filter((format) =>
        ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"].includes(format)
      );
      const detector = new window.BarcodeDetector(formats.length > 0 ? { formats } : undefined);

      const scan = async () => {
        const video = videoRef.current;

        if (!video || !streamRef.current || scannerSessionRef.current !== scannerSession) {
          return;
        }

        if (video.readyState < videoReadyState || video.videoWidth === 0 || video.videoHeight === 0) {
          frameRef.current = window.requestAnimationFrame(() => {
            void scan();
          });
          return;
        }

        let results: DetectorResult[] = [];

        try {
          results = await detector.detect(video);
        } catch {
          frameRef.current = window.requestAnimationFrame(() => {
            void scan();
          });
          return;
        }

        if (results[0]?.rawValue) {
          stopScanner();
          await lookupBarcode(results[0].rawValue);
          return;
        }

        frameRef.current = window.requestAnimationFrame(() => {
          void scan();
        });
      };

      void scan();
    } catch (scanError) {
      if (scannerSessionRef.current === scannerSession) {
        setError(scanError instanceof Error ? scanError.message : "无法启动摄像头");
        closeScanner();
      }
    } finally {
      if (scannerSessionRef.current === scannerSession) {
        isStartingRef.current = false;
        setIsStarting(false);
      }
    }
  }

  return (
    <section className="space-y-3 rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">条形码扫描</p>
          <h2 className="mt-1 text-lg font-semibold">扫一扫包装条码</h2>
        </div>
        <Button type="button" className="rounded-full" onClick={() => void startScanner()} disabled={isOpen || isStarting || loadingLookup}>
          {isStarting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}
          {isStarting ? "打开中…" : isOpen ? "摄像头已打开" : "打开摄像头"}
        </Button>
      </div>

      {isOpen ? (
        <div className="space-y-3 rounded-[1.4rem] bg-secondary/70 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">摄像头取景中</p>
            <button type="button" className="rounded-full p-2 text-muted-foreground hover:bg-background hover:text-foreground" onClick={closeScanner} aria-label="关闭摄像头">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="relative overflow-hidden rounded-[1.25rem] bg-black/90">
            <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
            {isStarting ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-medium text-white">
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                正在启动摄像头
              </div>
            ) : isScanning ? (
              <div className="pointer-events-none absolute inset-x-8 top-1/2 h-20 -translate-y-1/2 rounded-2xl border border-emerald-400/80">
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-emerald-400/80" />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Input
          value={manualBarcode}
          onChange={(event) => setManualBarcode(event.target.value)}
          placeholder="手动输入条码"
          className="h-11 min-w-0 rounded-[1.2rem]"
        />
        <Button
          type="button"
          variant="outline"
          className="shrink-0 rounded-[1.2rem]"
          disabled={!manualBarcode.trim() || loadingLookup}
          onClick={() => void lookupBarcode(manualBarcode)}
        >
          {loadingLookup ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </Button>
      </div>

      {error ? <div className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</div> : null}
    </section>
  );
}
