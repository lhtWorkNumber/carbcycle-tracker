import { NextRequest, NextResponse } from "next/server";

import { parseJsonBody, parseNumericResourceId, withObservedApiRoute } from "@/lib/api";
import { formatDateKey } from "@/lib/format";
import { getCurrentDbUserContext } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { createRateLimitResponse, rateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { createBodyRecordSchema } from "@/lib/validation";

function normalizeBodyRecord(record: {
  id: number;
  date: Date;
  weight: number;
  body_fat_percentage: number | null;
  waist_cm: number | null;
  before_photo_url: string | null;
  after_photo_url: string | null;
  note: string | null;
}) {
  return {
    id: `body-record-${record.id}`,
    date: formatDateKey(record.date),
    weight: record.weight,
    bodyFatPercentage: record.body_fat_percentage ?? undefined,
    waistCm: record.waist_cm ?? undefined,
    beforePhotoUrl: record.before_photo_url ?? undefined,
    afterPhotoUrl: record.after_photo_url ?? undefined,
    note: record.note ?? undefined
  };
}

export async function GET(request: NextRequest) {
  return withObservedApiRoute(request, "/api/body-records", async () => {
    const limit = rateLimit(request, { key: "body-records:get", limit: 60, windowMs: 60_000 });

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

    const userContext = await getCurrentDbUserContext();

    if (userContext.status === "unauthenticated") {
      return withRateLimitHeaders(NextResponse.json({ error: "未登录" }, { status: 401 }), limit);
    }

    if (userContext.status === "missing_profile") {
      return withRateLimitHeaders(
        NextResponse.json({ error: "请先完成用户资料设置后再记录身体数据。" }, { status: 409 }),
        limit
      );
    }

    const { user } = userContext;

    const record = await prisma.bodyRecord.create({
      data: {
        user_id: user.id,
        weight: parsed.data.weight,
        body_fat_percentage: parsed.data.body_fat_percentage ?? null,
        waist_cm: parsed.data.waist_cm ?? null,
        before_photo_url: parsed.data.before_photo_url ?? null,
        after_photo_url: parsed.data.after_photo_url ?? null,
        note: parsed.data.note,
        date: new Date(parsed.data.date)
      }
    });

    return withRateLimitHeaders(NextResponse.json(normalizeBodyRecord(record), { status: 201 }), limit);
  });
}

export async function DELETE(request: NextRequest) {
  return withObservedApiRoute(request, "/api/body-records", async () => {
    const limit = rateLimit(request, { key: "body-records:delete", limit: 20, windowMs: 60_000 });

    if (!limit.allowed) {
      return createRateLimitResponse(limit);
    }

    const bodyRecordId = parseNumericResourceId(request.nextUrl.searchParams.get("id"), "body-record-");

    if (!bodyRecordId) {
      return withRateLimitHeaders(NextResponse.json({ error: "缺少有效的身体记录 ID。" }, { status: 400 }), limit);
    }

    const userContext = await getCurrentDbUserContext();

    if (userContext.status === "unauthenticated") {
      return withRateLimitHeaders(NextResponse.json({ error: "未登录" }, { status: 401 }), limit);
    }

    if (userContext.status === "missing_profile") {
      return withRateLimitHeaders(NextResponse.json({ error: "请先完成用户资料设置。" }, { status: 409 }), limit);
    }

    const { user } = userContext;

    const deleted = await prisma.bodyRecord.deleteMany({
      where: {
        id: bodyRecordId,
        user_id: user.id
      }
    });

    if (deleted.count === 0) {
      return withRateLimitHeaders(NextResponse.json({ error: "没有找到这条身体记录。" }, { status: 404 }), limit);
    }

    return withRateLimitHeaders(NextResponse.json({ ok: true }), limit);
  });
}
