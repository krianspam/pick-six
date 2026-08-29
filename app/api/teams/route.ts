import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tournament = await prisma.tournament.findFirst({
    where: { active: true },
    select: { id: true, name: true, year: true, startsAt: true, endsAt: true },
  });
  if (!tournament) {
    return NextResponse.json({ error: "No active tournament" }, { status: 404 });
  }
  const teams = await prisma.team.findMany({
    where: { tournamentId: tournament.id },
    select: { id: true, code: true, name: true, flagUrl: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    { tournament, teams },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } }
  );
}
