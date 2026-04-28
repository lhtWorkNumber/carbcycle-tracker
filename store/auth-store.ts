import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  isConfigured: boolean;
  setUser: (user: User | null) => void;
  setConfigured: (configured: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isConfigured: false,
  setUser: (user) => set({ user }),
  setConfigured: (isConfigured) => set({ isConfigured })
}));
