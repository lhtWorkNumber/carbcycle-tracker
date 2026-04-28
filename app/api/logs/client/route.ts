import { NextRequest, NextResponse } from "next/server";

import { parseJsonBody, withObservedApiRoute } from "@/lib/api";
import { logError, logWarn } from "@/lib/monitoring/logger";
import { createRateLimitResponse, rateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { clientLogSchema } from "@/lib/validation-monitoring";

export async function POST(request: NextRequest) {
  return withObservedApiRoute(request, "/api/logs/client", async () => {
    const limit = rateLimit(request, { key: "logs-client:post", limit: 20, windowMs: 60_000 });

    if (!limit.allowed) {
      return createRateLimitResponse(limit);
    }

    const parsed = await parseJsonBody(request, clientLogSchema);

    if (!parsed.success) {
      return withRateLimitHeaders(parsed.response, limit);
    }

    const logPayload = {
      source: parsed.data.source,
      href: parsed.data.href,
      userAgent: parsed.data.userAgent,
      stack: parsed.data.stack,
      message: parsed.data.message
    };

    if (parsed.data.level === "error") {
      logError("client.error", logPayload);
    } else {
      logWarn("client.warning", logPayload);
    }

    return withRateLimitHeaders(NextResponse.json({ ok: true }), limit);
  });
}
