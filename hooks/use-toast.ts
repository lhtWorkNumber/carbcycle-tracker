"use client";

import { useToastStore, type ToastVariant } from "@/store/toast-store";

export function useToast() {
  const pushToast = useToastStore((state) => state.pushToast);

  return {
    toast: ({
      title,
      description,
      variant = "default"
    }: {
      title: string;
      description?: string;
      variant?: ToastVariant;
    }) => pushToast({ title, description, variant })
  };
}
