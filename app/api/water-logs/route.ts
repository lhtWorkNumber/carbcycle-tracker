import { NextRequest, NextResponse } from "next/server";

import { parseJsonBody } from "@/lib/api";
import { getCurrentDbUser } from "@/lib/current-user";
import { formatDateKey } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { createRateLimitResponse, rateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { upsertWaterLogSchema } from "@/lib/validation";

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
    entries: JSON.parse(log.entries_json) as number[]
  };
}

export async function GET(request: NextRequest) {
  const limit = rateLimit(request, { key: "water-logs:get", limit: 60, windowMs: 60_000 });

  if (!limit.allowed) {
    return createRateLimitResponse(limit);
  }

  const user = await getCurrentDbUser();

  if (!user) {
    return withRateLimitHeaders(NextResponse.json({ error: "未登录" }, { status: 401 }), limit);
  }

  const logs = await prisma.waterLog.findMany({
    where: {
      user_id: user.id
    },
    orderBy: {
      date: "desc"
    }
  });

  return withRateLimitHeaders(NextResponse.json(logs.map(normalizeWaterLog)), limit);
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(request, { key: "water-logs:post", limit: 30, windowMs: 60_000 });

  if (!limit.allowed) {
    return createRateLimitResponse(limit);
  }

  const user = await getCurrentDbUser();

  if (!user) {
    return withRateLimitHeaders(NextResponse.json({ error: "未登录" }, { status: 401 }), limit);
  }

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
}
