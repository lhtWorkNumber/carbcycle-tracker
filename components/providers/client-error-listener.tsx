"use client";

import { useEffect } from "react";

import { logError } from "@/lib/monitoring/logger";

export function ClientErrorListener() {
  useEffect(() => {
    async function sendLog(payload: {
      level: "error" | "warn";
      source: "window-error" | "unhandled-rejection";
      message: string;
      stack?: string;
    }) {
      try {
        await fetch("/api/logs/client", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...payload,
            href: window.location.href,
            userAgent: navigator.userAgent
          })
        });
      } catch (error) {
        logError("client.error.report_failed", {
          error,
          href: window.location.href
        });
      }
    }

    function handleWindowError(event: ErrorEvent) {
      void sendLog({
        level: "error",
        source: "window-error",
        message: event.message,
        stack: event.error?.stack
      });
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      const reason =
        event.reason instanceof Error
          ? { message: event.reason.message, stack: event.reason.stack }
          : { message: String(event.reason) };

      void sendLog({
        level: "error",
        source: "unhandled-rejection",
        message: reason.message,
        stack: reason.stack
      });
    }

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
