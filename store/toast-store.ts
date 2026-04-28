import { create } from "zustand";

export type ToastVariant = "default" | "success" | "error";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastState {
  toasts: ToastItem[];
  pushToast: (toast: Omit<ToastItem, "id">) => string;
  dismissToast: (id: string) => void;
}

function createId() {
  return `toast-${crypto.randomUUID()}`;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  pushToast: (toast) => {
    const id = createId();

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }));

     window.setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((item) => item.id !== id)
      }));
    }, 3200);

    return id;
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }))
}));
