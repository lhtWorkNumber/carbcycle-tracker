import { NextRequest, NextResponse } from "next/server";

import { withObservedApiRoute } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { resolveServerEnvMode, validateServerEnv } from "@/lib/env/server-env";

export async function GET(request: NextRequest) {
  return withObservedApiRoute(request, "/api/healthz", async () => {
    const envCheck = validateServerEnv(resolveServerEnvMode());

    if (!envCheck.success) {
      return NextResponse.json(
        {
          status: "error",
          checks: {
            env: false,
            database: false
          },
          detail: envCheck.message
        },
        { status: 500 }
      );
    }

    try {
      await prisma.$queryRaw`SELECT 1`;

      return NextResponse.json({
        status: "ok",
        checks: {
          env: true,
          database: true
        }
      });
    } catch (error) {
      return NextResponse.json(
        {
          status: "error",
          checks: {
            env: true,
            database: false
          },
          detail: error instanceof Error ? error.message : "unknown database error"
        },
        { status: 500 }
      );
    }
  });
}
