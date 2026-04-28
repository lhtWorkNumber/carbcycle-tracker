"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type DeferredInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

export function InstallPromptBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as DeferredInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  if (!deferredPrompt || dismissed) {
    return null;
  }

  return (
    <div className="sticky top-4 z-40 mx-auto w-full max-w-4xl px-4">
      <div className="flex items-center justify-between gap-3 rounded-[1.6rem] bg-primary px-4 py-3 text-primary-foreground shadow-[0_16px_35px_rgba(34,197,94,0.28)]">
        <div>
          <p className="text-sm font-semibold">安装到桌面</p>
          <p className="text-xs text-primary-foreground/80">离线也能快速打开碳循环追踪，像原生应用一样使用。</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleInstall()}
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold"
          >
            <Download className="h-4 w-4" />
            立即安装
          </button>
          <button type="button" onClick={() => setDismissed(true)} aria-label="关闭安装提示">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
