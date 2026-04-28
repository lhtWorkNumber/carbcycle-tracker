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
  const [manualBarcode, setManualBarcode] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  async function lookupBarcode(barcode: string) {
    setLoadingLookup(true);
    setError(null);

    try {
      const response = await fetch(`/api/barcode/${barcode}`);

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
      setIsOpen(false);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "条码识别失败");
      toast({
        title: "条码识别失败",
        description: lookupError instanceof Error ? lookupError.message : "请手动输入条码重试。",
        variant: "error"
      });
    } finally {
      setLoadingLookup(false);
    }
  }

  function stopScanner() {
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsScanning(false);
  }

  async function startScanner() {
    if (!window.BarcodeDetector) {
      setError("当前浏览器不支持实时扫码，请使用手动条码输入。");
      return;
    }

    try {
      setError(null);
      setIsOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment"
          }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsScanning(true);

      const supportedFormats =
        typeof window.BarcodeDetector.getSupportedFormats === "function"
          ? await window.BarcodeDetector.getSupportedFormats()
          : ["ean_13", "ean_8", "upc_a", "upc_e"];
      const detector = new window.BarcodeDetector({
        formats: supportedFormats.filter((format) =>
          ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"].includes(format)
        )
      });

      const scan = async () => {
        if (!videoRef.current) {
          return;
        }

        const results = await detector.detect(videoRef.current);

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
      setError(scanError instanceof Error ? scanError.message : "无法启动摄像头");
      stopScanner();
    }
  }

  return (
    <section className="space-y-3 rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">条形码扫描</p>
          <h2 className="mt-1 text-lg font-semibold">扫一扫包装条码</h2>
        </div>
        <Button type="button" className="rounded-full" onClick={() => void startScanner()}>
          <ScanLine className="mr-2 h-4 w-4" />
          打开摄像头
        </Button>
      </div>

      {isOpen ? (
        <div className="space-y-3 rounded-[1.4rem] bg-secondary/70 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">摄像头取景中</p>
            <button type="button" onClick={() => { stopScanner(); setIsOpen(false); }}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="relative overflow-hidden rounded-[1.25rem] bg-black/90">
            <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
            {isScanning ? (
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
          className="h-11 rounded-[1.2rem]"
        />
        <Button
          type="button"
          variant="outline"
          className="rounded-[1.2rem]"
          disabled={!manualBarcode || loadingLookup}
          onClick={() => void lookupBarcode(manualBarcode)}
        >
          {loadingLookup ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </Button>
      </div>

      {error ? <div className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</div> : null}
    </section>
  );
}
