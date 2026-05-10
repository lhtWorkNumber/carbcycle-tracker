import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("@/lib/monitoring/logger", () => ({
  logError: vi.fn(),
  logInfo: vi.fn()
}));

import {
  parseJsonArray,
  parseJsonBody,
  parseJsonValue,
  parseNumericResourceId,
  parseOptionalJsonObject,
  withObservedApiRoute
} from "@/lib/api";

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

describe("parseJsonValue", () => {
  it("returns parsed values that pass the supplied guard", () => {
    expect(
      parseJsonValue(
        '{"ok":true}',
        { ok: false },
        (value): value is { ok: boolean } => typeof value === "object" && value !== null
      )
    ).toEqual({
      ok: true
    });
  });

  it("falls back for malformed JSON or unexpected shapes", () => {
    expect(parseJsonValue("{bad", "fallback")).toBe("fallback");
    expect(parseJsonValue("[1,2]", "fallback", (value): value is string => typeof value === "string")).toBe("fallback");
  });
});

describe("parseJsonArray", () => {
  it("returns arrays and can validate every item", () => {
    expect(parseJsonArray<number>("[250,500]", [], isNumber)).toEqual([250, 500]);
  });

  it("falls back for malformed, non-array, or mixed-type payloads", () => {
    expect(parseJsonArray<number>("{bad", [200], isNumber)).toEqual([200]);
    expect(parseJsonArray<number>('{"amount":250}', [200], isNumber)).toEqual([200]);
    expect(parseJsonArray<number>('[250,"500"]', [200], isNumber)).toEqual([200]);
  });
});

describe("parseOptionalJsonObject", () => {
  it("returns undefined instead of throwing for dirty optional JSON fields", () => {
    expect(parseOptionalJsonObject("{bad")).toBeUndefined();
    expect(parseOptionalJsonObject("[1,2]")).toBeUndefined();
  });

  it("returns parsed objects", () => {
    expect(parseOptionalJsonObject<{ caloriesDelta: number }>('{"caloriesDelta":120}')).toEqual({
      caloriesDelta: 120
    });
  });
});

describe("parseNumericResourceId", () => {
  it("extracts positive integer IDs with the expected prefix", () => {
    expect(parseNumericResourceId("meal-log-42", "meal-log-")).toBe(42);
  });

  it("rejects missing prefixes, decimals, zero, and negative values", () => {
    expect(parseNumericResourceId(null, "meal-log-")).toBeNull();
    expect(parseNumericResourceId("body-record-42", "meal-log-")).toBeNull();
    expect(parseNumericResourceId("meal-log-1.5", "meal-log-")).toBeNull();
    expect(parseNumericResourceId("meal-log-0", "meal-log-")).toBeNull();
    expect(parseNumericResourceId("meal-log--1", "meal-log-")).toBeNull();
  });
});

describe("parseJsonBody", () => {
  const schema = z.object({
    name: z.string()
  });

  it("returns a 400 response for malformed JSON", async () => {
    const parsed = await parseJsonBody(
      new NextRequest("http://localhost/api/test", {
        method: "POST",
        body: "{bad",
        headers: { "content-type": "application/json" }
      }),
      schema
    );

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.response.status).toBe(400);
      await expect(parsed.response.json()).resolves.toEqual({ error: "请求体不是合法的 JSON。" });
    }
  });

  it("returns a 400 response for validation failures", async () => {
    const parsed = await parseJsonBody(
      new NextRequest("http://localhost/api/test", {
        method: "POST",
        body: JSON.stringify({ name: 123 }),
        headers: { "content-type": "application/json" }
      }),
      schema
    );

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.response.status).toBe(400);
      await expect(parsed.response.json()).resolves.toMatchObject({ error: "请求参数校验失败。" });
    }
  });
});

describe("withObservedApiRoute", () => {
  it("adds request metadata headers to successful responses", async () => {
    const response = await withObservedApiRoute(
      new NextRequest("http://localhost/api/test", {
        headers: { "x-request-id": "request-1" }
      }),
      "/api/test",
      async () => NextResponse.json({ ok: true })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("request-1");
    expect(response.headers.get("x-response-time-ms")).toMatch(/^\d+$/);
  });

  it("converts thrown errors into the shared 500 response", async () => {
    const response = await withObservedApiRoute(
      new NextRequest("http://localhost/api/test", {
        headers: { "x-request-id": "request-2" }
      }),
      "/api/test",
      async () => {
        throw new Error("boom");
      }
    );

    expect(response.status).toBe(500);
    expect(response.headers.get("x-request-id")).toBe("request-2");
    await expect(response.json()).resolves.toEqual({
      error: "服务器内部错误，请稍后再试。",
      requestId: "request-2"
    });
  });
});
