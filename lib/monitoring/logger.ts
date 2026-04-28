type LogLevel = "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return error;
}

function writeLog(level: LogLevel, event: string, meta: LogMeta = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...Object.fromEntries(
      Object.entries(meta).map(([key, value]) => [key, key === "error" ? normalizeError(value) : value])
    )
  };

  const serialized = JSON.stringify(payload);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export function logInfo(event: string, meta?: LogMeta) {
  writeLog("info", event, meta);
}

export function logWarn(event: string, meta?: LogMeta) {
  writeLog("warn", event, meta);
}

export function logError(event: string, meta?: LogMeta) {
  writeLog("error", event, meta);
}
