import { NextRequest, NextResponse } from "next/server";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "anonymous";
  }

  return request.headers.get("x-real-ip") ?? "anonymous";
}

export function rateLimit(request: NextRequest, options: RateLimitOptions): RateLimitResult {
  const effectiveLimit = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? options.limit);
  const effectiveWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? options.windowMs);
  const now = Date.now();
  const identifier = `${options.key}:${getClientIp(request)}`;
  const bucket = buckets.get(identifier);

  if (!bucket || bucket.resetAt <= now) {
    const nextBucket = {
      count: 1,
      resetAt: now + effectiveWindowMs
    };
    buckets.set(identifier, nextBucket);

    return {
      allowed: true,
      limit: effectiveLimit,
      remaining: effectiveLimit - 1,
      resetAt: nextBucket.resetAt
    };
  }

  if (bucket.count >= effectiveLimit) {
    return {
      allowed: false,
      limit: effectiveLimit,
      remaining: 0,
      resetAt: bucket.resetAt
    };
  }

  bucket.count += 1;
  buckets.set(identifier, bucket);

  return {
    allowed: true,
    limit: effectiveLimit,
    remaining: Math.max(0, effectiveLimit - bucket.count),
    resetAt: bucket.resetAt
  };
}

export function createRateLimitResponse(result: RateLimitResult) {
  const response = NextResponse.json(
    {
      error: "请求过于频繁，请稍后再试。"
    },
    { status: 429 }
  );

  return withRateLimitHeaders(response, result);
}

export function withRateLimitHeaders(response: NextResponse, result: RateLimitResult) {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
  return response;
}
