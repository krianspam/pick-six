import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const last = await prisma.syncLog.findFirst({
    orderBy: { ranAt: "desc" },
    select: { ranAt: true, created: true, updated: true, settled: true },
  });

  return NextResponse.json(
    {
      lastSyncAt: last?.ranAt?.toISOString() ?? null,
      lastUpdate: last
        ? { created: last.created, updated: last.updated, settled: last.settled }
        : null,
    },
    {
      headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" },
    }
  );
}
