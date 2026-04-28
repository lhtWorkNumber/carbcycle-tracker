"use client";

import { CheckCircle2, CircleAlert, X } from "lucide-react";

import { useToastStore } from "@/store/toast-store";
import { cn } from "@/lib/utils";

const variantClassMap = {
  default: "bg-white text-foreground dark:bg-slate-900 dark:text-white",
  success: "bg-emerald-600 text-white",
  error: "bg-rose-600 text-white"
} as const;

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-3 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[1.5rem] px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.18)]",
            variantClassMap[toast.variant ?? "default"]
          )}
        >
          {toast.variant === "error" ? <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}
          <div className="flex-1">
            <p className="font-semibold">{toast.title}</p>
            {toast.description ? <p className="mt-1 text-sm opacity-85">{toast.description}</p> : null}
          </div>
          <button type="button" onClick={() => dismissToast(toast.id)} aria-label="关闭提示">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
