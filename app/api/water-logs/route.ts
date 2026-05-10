import { NextRequest, NextResponse } from "next/server";

import { parseJsonArray, parseJsonBody, withObservedApiRoute } from "@/lib/api";
import { getCurrentDbUserContext } from "@/lib/current-user";
import { formatDateKey } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { createRateLimitResponse, rateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { upsertWaterLogSchema } from "@/lib/validation";

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeWaterLog(log: {
  id: number;
  date: Date;
  target_ml: number;
  amount_ml: number;
  entries_json: string;
}) {
  return {
    id: `water-log-${log.id}`,
    date: formatDateKey(log.date),
    targetMl: log.target_ml,
    amountMl: log.amount_ml,
    entries: parseJsonArray<number>(log.entries_json, [], isNumber)
  };
}

export async function GET(request: NextRequest) {
  return withObservedApiRoute(request, "/api/water-logs", async () => {
    const limit = rateLimit(request, { key: "water-logs:get", limit: 60, windowMs: 60_000 });

    if (!limit.allowed) {
      return createRateLimitResponse(limit);
    }

    const userContext = await getCurrentDbUserContext();

    if (userContext.status === "unauthenticated") {
      return withRateLimitHeaders(NextResponse.json({ error: "未登录" }, { status: 401 }), limit);
    }

    if (userContext.status === "missing_profile") {
      return withRateLimitHeaders(NextResponse.json([]), limit);
    }

    const { user } = userContext;

    const logs = await prisma.waterLog.findMany({
      where: {
        user_id: user.id
      },
      orderBy: {
        date: "desc"
      }
    });

    return withRateLimitHeaders(NextResponse.json(logs.map(normalizeWaterLog)), limit);
  });
}

export async function POST(request: NextRequest) {
  return withObservedApiRoute(request, "/api/water-logs", async () => {
    const limit = rateLimit(request, { key: "water-logs:post", limit: 30, windowMs: 60_000 });

    if (!limit.allowed) {
      return createRateLimitResponse(limit);
    }

    const userContext = await getCurrentDbUserContext();

    if (userContext.status === "unauthenticated") {
      return withRateLimitHeaders(NextResponse.json({ error: "未登录" }, { status: 401 }), limit);
    }

    if (userContext.status === "missing_profile") {
      return withRateLimitHeaders(
        NextResponse.json({ error: "请先完成用户资料设置后再记录饮水。" }, { status: 409 }),
        limit
      );
    }

    const { user } = userContext;

    const parsed = await parseJsonBody(request, upsertWaterLogSchema);

    if (!parsed.success) {
      return withRateLimitHeaders(parsed.response, limit);
    }

    const log = await prisma.waterLog.upsert({
      where: {
        user_id_date: {
          user_id: user.id,
          date: new Date(parsed.data.date)
        }
      },
      update: {
        target_ml: parsed.data.targetMl,
        amount_ml: parsed.data.amountMl,
        entries_json: JSON.stringify(parsed.data.entries)
      },
      create: {
        user_id: user.id,
        date: new Date(parsed.data.date),
        target_ml: parsed.data.targetMl,
        amount_ml: parsed.data.amountMl,
        entries_json: JSON.stringify(parsed.data.entries)
      }
    });

    return withRateLimitHeaders(NextResponse.json(normalizeWaterLog(log), { status: 201 }), limit);
  });
}
