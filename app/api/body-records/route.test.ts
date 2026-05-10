import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/current-user", () => ({
  getCurrentDbUserContext: vi.fn()
}));

vi.mock("@/lib/monitoring/logger", () => ({
  logError: vi.fn(),
  logInfo: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    bodyRecord: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn()
    }
  }
}));

import { getCurrentDbUserContext } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/body-records/route";

const getCurrentDbUserContextMock = vi.mocked(getCurrentDbUserContext);
const createBodyRecordMock = vi.mocked(prisma.bodyRecord.create);
type ReadyUserContext = Extract<Awaited<ReturnType<typeof getCurrentDbUserContext>>, { status: "ready" }>;

describe("POST /api/body-records", () => {
  it("persists and returns before/after photo URLs", async () => {
    getCurrentDbUserContextMock.mockResolvedValue({
      status: "ready",
      authUser: { id: "auth-1" } as ReadyUserContext["authUser"],
      user: { id: 7 } as ReadyUserContext["user"]
    });
    createBodyRecordMock.mockResolvedValue({
      id: 11,
      user_id: 7,
      date: new Date("2026-05-06T00:00:00.000Z"),
      weight: 72.5,
      body_fat_percentage: 18.2,
      waist_cm: 82,
      before_photo_url: "https://example.com/photos/before.jpg",
      after_photo_url: "https://example.com/photos/after.jpg",
      note: "May check-in"
    });

    const response = await POST(
      new NextRequest("http://localhost/api/body-records", {
        method: "POST",
        body: JSON.stringify({
          date: "2026-05-06T00:00:00.000Z",
          weight: 72.5,
          body_fat_percentage: 18.2,
          waist_cm: 82,
          before_photo_url: "https://example.com/photos/before.jpg",
          after_photo_url: "https://example.com/photos/after.jpg",
          note: "May check-in"
        }),
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "body-records-post-test"
        }
      })
    );

    expect(response.status).toBe(201);
    expect(createBodyRecordMock).toHaveBeenCalledWith({
      data: {
        user_id: 7,
        weight: 72.5,
        body_fat_percentage: 18.2,
        waist_cm: 82,
        before_photo_url: "https://example.com/photos/before.jpg",
        after_photo_url: "https://example.com/photos/after.jpg",
        note: "May check-in",
        date: new Date("2026-05-06T00:00:00.000Z")
      }
    });
    await expect(response.json()).resolves.toEqual({
      id: "body-record-11",
      date: "2026-05-06",
      weight: 72.5,
      bodyFatPercentage: 18.2,
      waistCm: 82,
      beforePhotoUrl: "https://example.com/photos/before.jpg",
      afterPhotoUrl: "https://example.com/photos/after.jpg",
      note: "May check-in"
    });
  });
});
