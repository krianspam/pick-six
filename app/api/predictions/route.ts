import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPredictionWindow } from "@/lib/prediction-window";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const prediction = z.object({
  matchId: z.string().min(1),
  homeScore: z.number().int().min(0).max(30),
  awayScore: z.number().int().min(0).max(30),
  leagueId: z.string().min(1),
  penaltyWinnerId: z.string().nullable().optional(),
  sameForAll: z.boolean().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 30 predictions per minute per user
  if (!checkRateLimit(`pred:${session.user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Slow down." }, { status: 429 });
  }

  const parsed = prediction.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid prediction" }, { status: 400 });

  const match = await prisma.match.findUnique({
    where: { id: parsed.data.matchId },
    select: { kickoff: true, locked: true, status: true, tournamentId: true },
  });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  const predictionWindow = getPredictionWindow(match.kickoff);
  if (match.locked || match.status !== "UPCOMING" || !predictionWindow.isOpen) {
    return NextResponse.json({
      error: predictionWindow.state === "scheduled" ? "Predictions open 24 hours before kickoff" : "Predictions are closed",
      opensAt: predictionWindow.opensAt.toISOString(),
      kickoff: predictionWindow.kickoffAt.toISOString(),
    }, { status: 423 });
  }

  if (parsed.data.sameForAll) {
    const memberships = await prisma.leagueMember.findMany({
      where: { userId: session.user.id },
      include: { league: true },
    });

    const leagueIds = memberships
      .filter((m) => m.league.tournamentId === match.tournamentId)
      .map((m) => m.leagueId);

    if (leagueIds.length === 0) {
      return NextResponse.json({ error: "No leagues found for this tournament" }, { status: 400 });
    }

    const saved = [];
    for (const leagueId of leagueIds) {
      const prediction = await prisma.prediction.upsert({
        where: { matchId_userId_leagueId: { matchId: parsed.data.matchId, userId: session.user.id, leagueId } },
        update: { homeScore: parsed.data.homeScore, awayScore: parsed.data.awayScore, penaltyWinnerId: parsed.data.penaltyWinnerId },
        create: {
          matchId: parsed.data.matchId,
          userId: session.user.id,
          leagueId,
          homeScore: parsed.data.homeScore,
          awayScore: parsed.data.awayScore,
          penaltyWinnerId: parsed.data.penaltyWinnerId,
        },
      });
      saved.push(prediction);
    }

    return NextResponse.json(saved);
  }

  const saved = await prisma.prediction.upsert({
    where: { matchId_userId_leagueId: { matchId: parsed.data.matchId, userId: session.user.id, leagueId: parsed.data.leagueId } },
    update: { homeScore: parsed.data.homeScore, awayScore: parsed.data.awayScore, penaltyWinnerId: parsed.data.penaltyWinnerId },
    create: {
      matchId: parsed.data.matchId,
      userId: session.user.id,
      leagueId: parsed.data.leagueId,
      homeScore: parsed.data.homeScore,
      awayScore: parsed.data.awayScore,
      penaltyWinnerId: parsed.data.penaltyWinnerId,
    },
  });

  return NextResponse.json(saved);
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("leagueId");

  const where: any = { userId: session.user.id };
  if (leagueId) where.leagueId = leagueId;

  const predictions = await prisma.prediction.findMany({
    where,
  });
  return NextResponse.json(predictions);
}
