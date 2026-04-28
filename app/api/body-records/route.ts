import { NextRequest, NextResponse } from "next/server";

import { parseJsonBody, withObservedApiRoute } from "@/lib/api";
import { formatDateKey } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { createRateLimitResponse, rateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { getCurrentAuthUser } from "@/lib/supabase/server";
import { createBodyRecordSchema } from "@/lib/validation";

function normalizeBodyRecord(record: {
  id: number;
  date: Date;
  weight: number;
  body_fat_percentage: number | null;
  waist_cm: number | null;
  note: string | null;
}) {
  return {
    id: `body-record-${record.id}`,
    date: formatDateKey(record.date),
    weight: record.weight,
    bodyFatPercentage: record.body_fat_percentage ?? undefined,
    waistCm: record.waist_cm ?? undefined,
    note: record.note ?? undefined
  };
}

export async function GET(request: NextRequest) {
  return withObservedApiRoute(request, "/api/body-records", async () => {
    const limit = rateLimit(request, { key: "body-records:get", limit: 60, windowMs: 60_000 });

    if (!limit.allowed) {
      return createRateLimitResponse(limit);
    }

  const authUser = await getCurrentAuthUser();

  if (!authUser) {
    return withRateLimitHeaders(NextResponse.json({ error: "未登录" }, { status: 401 }), limit);
  }

  const user = await prisma.user.findUnique({
    where: {
      auth_user_id: authUser.id
    },
    select: {
      id: true
    }
  });

  if (!user) {
    return withRateLimitHeaders(NextResponse.json([]), limit);
  }

  const records = await prisma.bodyRecord.findMany({
    where: {
      user_id: user.id
    },
    orderBy: { date: "desc" }
  });

    return withRateLimitHeaders(NextResponse.json(records.map(normalizeBodyRecord)), limit);
  });
}

export async function POST(request: NextRequest) {
  return withObservedApiRoute(request, "/api/body-records", async () => {
    const limit = rateLimit(request, { key: "body-records:post", limit: 20, windowMs: 60_000 });

    if (!limit.allowed) {
      return createRateLimitResponse(limit);
    }

  const parsed = await parseJsonBody(request, createBodyRecordSchema);

  if (!parsed.success) {
    return withRateLimitHeaders(parsed.response, limit);
  }

  const authUser = await getCurrentAuthUser();

  if (!authUser) {
    return withRateLimitHeaders(NextResponse.json({ error: "未登录" }, { status: 401 }), limit);
  }

  const user = await prisma.user.findUnique({
    where: {
      auth_user_id: authUser.id
    },
    select: {
      id: true
    }
  });

  if (!user) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "请先完成用户资料设置后再记录身体数据。" }, { status: 409 }),
      limit
    );
  }

  const record = await prisma.bodyRecord.create({
    data: {
      user_id: user.id,
      weight: parsed.data.weight,
      body_fat_percentage: parsed.data.body_fat_percentage ?? null,
      waist_cm: parsed.data.waist_cm ?? null,
      note: parsed.data.note,
      date: new Date(parsed.data.date)
    }
  });

    return withRateLimitHeaders(NextResponse.json(normalizeBodyRecord(record), { status: 201 }), limit);
  });
}
