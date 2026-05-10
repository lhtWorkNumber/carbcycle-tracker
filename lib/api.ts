import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";

import { logError, logInfo } from "@/lib/monitoring/logger";

export async function parseJsonBody<T>(request: NextRequest, schema: ZodSchema<T>) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      success: false as const,
      response: NextResponse.json({ error: "请求体不是合法的 JSON。" }, { status: 400 })
    };
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    return {
      success: false as const,
      response: NextResponse.json(
        {
          error: "请求参数校验失败。",
          details: result.error.flatten()
        },
        { status: 400 }
      )
    };
  }

  return {
    success: true as const,
    data: result.data
  };
}

export function parseNumericResourceId(value: string | null, prefix: string) {
  if (!value?.startsWith(prefix)) {
    return null;
  }

  const numericId = Number(value.slice(prefix.length));
  return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
}

export function parseJsonValue<T>(
  value: string | null | undefined,
  fallback: T,
  isExpectedValue?: (parsed: unknown) => parsed is T
): T {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!isExpectedValue) {
      return parsed as T;
    }

    return isExpectedValue(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function parseJsonArray<T>(
  value: string | null | undefined,
  fallback: T[] = [],
  isExpectedItem?: (item: unknown) => item is T
): T[] {
  const parsed = parseJsonValue<unknown[]>(value, fallback, Array.isArray);

  if (!isExpectedItem) {
    return parsed as T[];
  }

  return parsed.every(isExpectedItem) ? parsed : fallback;
}

export function parseOptionalJsonObject<T extends object>(value: string | null | undefined): T | undefined {
  return parseJsonValue<T | undefined>(
    value,
    undefined,
    (parsed): parsed is T => typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
  );
}

export async function withObservedApiRoute(
  request: NextRequest,
  route: string,
  handler: (context: { requestId: string; startedAt: number }) => Promise<NextResponse>
) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const startedAt = Date.now();

  logInfo("api.request.started", {
    requestId,
    route,
    method: request.method
  });

  try {
    const response = await handler({ requestId, startedAt });
    const durationMs = Date.now() - startedAt;

    response.headers.set("x-request-id", requestId);
    response.headers.set("x-response-time-ms", String(durationMs));

    logInfo("api.request.completed", {
      requestId,
      route,
      method: request.method,
      status: response.status,
      durationMs
    });

    return response;
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    logError("api.request.failed", {
      requestId,
      route,
      method: request.method,
      durationMs,
      error
    });

    const response = NextResponse.json(
      {
        error: "服务器内部错误，请稍后再试。",
        requestId
      },
      { status: 500 }
    );

    response.headers.set("x-request-id", requestId);
    response.headers.set("x-response-time-ms", String(durationMs));

    return response;
  }
}
