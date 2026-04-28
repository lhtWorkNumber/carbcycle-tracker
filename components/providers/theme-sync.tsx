"use client";

import { useEffect } from "react";

import { useTrackerStore } from "@/store/tracker-store";

export function ThemeSync() {
  const theme = useTrackerStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return null;
}
