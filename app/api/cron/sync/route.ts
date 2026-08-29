import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MatchStatus, Stage } from "@prisma/client";

/**
 * football-data.org season IDs for Champions League
 * These are fetched from /v4/competitions/2001/matches and reflect their internal IDs.
 * Update SEASON_ID when the new season goes live.
 *
 * 2590 = 2026/27 season (upcoming / current — draws published Aug 2026, fixtures Sept 2026)
 */
const SEASON_ID = 2590;
const COMPETITION_ID = 2001; // UEFA Champions League

async function fetchMatches(from: string, to: string): Promise<any[]> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://api.football-data.org/v4/competitions/${COMPETITION_ID}/matches?season=${SEASON_ID}&dateFrom=${from}&dateTo=${to}&limit=100`;
    const res = await fetch(url, {
      headers: { "X-Auth-Token": apiKey },
      next: { revalidate: 0 }, // always bust cache
    });

    if (!res.ok) {
      console.error(`[sync] football-data error: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    return data.matches ?? [];
  } catch (e) {
    console.error("[sync] fetch error:", e);
    return [];
  }
}

function mapApiStatus(status: string): MatchStatus {
  if (["IN_PLAY", "PAUSED"].includes(status)) return MatchStatus.LIVE;
  if (["FINISHED", "AWARDED"].includes(status)) return MatchStatus.FINISHED;
  return MatchStatus.UPCOMING;
}

function mapStage(stage: string | null, group: string | null): Stage {
  const key = stage ?? group ?? "";
  const map: Record<string, Stage> = {
    LEAGUE_STAGE: Stage.LEAGUE_PHASE,
    LEAGUE_PHASE: Stage.LEAGUE_PHASE,
    GROUP_STAGE: Stage.GROUP,
    GROUP: Stage.GROUP,
    ROUND_OF_32: Stage.ROUND_OF_32,
    LAST_32: Stage.ROUND_OF_32,
    ROUND_OF_16: Stage.ROUND_OF_16,
    LAST_16: Stage.ROUND_OF_16,
    QUARTER_FINAL: Stage.QUARTER_FINAL,
    QUARTER_FINALS: Stage.QUARTER_FINAL,
    SEMI_FINAL: Stage.SEMI_FINAL,
    SEMI_FINALS: Stage.SEMI_FINAL,
    THIRD_PLACE: Stage.THIRD_PLACE,
    FINAL: Stage.FINAL,
  };
  return map[key] ?? Stage.LEAGUE_PHASE;
}

import { scoreLeague, type Pick } from "@/lib/scoring";

function scoreMatch(
  homeScore: number | null,
  awayScore: number | null,
  homePenaltyScore: number | null,
  awayPenaltyScore: number | null
): string {
  if (homeScore === null || awayScore === null) return "—";
  const pens = homePenaltyScore !== null && awayPenaltyScore !== null;
  const base = `${homeScore}–${awayScore}`;
  return pens ? `${base} (${homePenaltyScore}–${awayPenaltyScore} pen)` : base;
}

export async function GET(request: Request) {
  // Auth: require CRON_SECRET bearer token
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeTournament = await prisma.tournament.findFirst({ where: { active: true } });
  if (!activeTournament) {
    return NextResponse.json({ error: "No active tournament in DB" }, { status: 500 });
  }

  // Scan window: from 7 days ago → end of tournament
  const from = new Date();
  from.setDate(from.getDate() - 7);
  const to = activeTournament.endsAt;

  const rawMatches = await fetchMatches(from.toISOString().split("T")[0], to.toISOString().split("T")[0]);

  let updated = 0;
  let created = 0;
  let errors = 0;

  for (const apiMatch of rawMatches) {
    const homeCode = apiMatch.homeTeam?.tla;
    const awayCode = apiMatch.awayTeam?.tla;
    if (!homeCode || !awayCode) continue;

    const newStatus = mapApiStatus(apiMatch.status);
    const homeScore = apiMatch.score?.fullTime?.home ?? apiMatch.score?.regularTime?.home ?? null;
    const awayScore = apiMatch.score?.fullTime?.away ?? apiMatch.score?.regularTime?.away ?? null;
    const homePenaltyScore = apiMatch.score?.penalties?.home ?? null;
    const awayPenaltyScore = apiMatch.score?.penalties?.away ?? null;
    const kickoff = new Date(apiMatch.utcDate);

    // Try to find by team codes + kickoff window (±2 hours)
    let dbMatch = await prisma.match.findFirst({
      where: {
        tournamentId: activeTournament.id,
        homeTeam: { code: homeCode },
        awayTeam: { code: awayCode },
        kickoff: { gte: new Date(kickoff.getTime() - 2 * 3600 * 1000), lte: new Date(kickoff.getTime() + 2 * 3600 * 1000) },
      },
    });

    // Also try by ID from the API
    if (!dbMatch && apiMatch.id) {
      dbMatch = await prisma.match.findUnique({ where: { id: String(apiMatch.id) } });
    }

    if (dbMatch) {
      // Only update if status or scores changed
      const changed =
        dbMatch.status !== newStatus ||
        dbMatch.homeScore !== homeScore ||
        dbMatch.awayScore !== awayScore;

      if (changed) {
        await prisma.match.update({
          where: { id: dbMatch.id },
          data: {
            status: newStatus,
            locked: newStatus !== MatchStatus.UPCOMING,
            homeScore,
            awayScore,
            homePenaltyScore,
            awayPenaltyScore,
          },
        });
        updated++;
        console.log(`[sync] Updated ${homeCode} ${scoreMatch(homeScore, awayScore, homePenaltyScore, awayPenaltyScore)} ${awayCode} (${newStatus})`);
      }
    } else {
      // Create — requires teams to exist in DB
      try {
        const homeTeam = await prisma.team.findFirst({
          where: { tournamentId: activeTournament.id, code: homeCode },
        });
        const awayTeam = await prisma.team.findFirst({
          where: { tournamentId: activeTournament.id, code: awayCode },
        });

        if (homeTeam && awayTeam) {
          await prisma.match.create({
            data: {
              id: String(apiMatch.id),
              tournamentId: activeTournament.id,
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              kickoff,
              venue: apiMatch.venue ?? "TBD",
              stage: mapStage(apiMatch.stage, apiMatch.group),
              groupName: apiMatch.group ?? null,
              status: newStatus,
              homeScore,
              awayScore,
              homePenaltyScore,
              awayPenaltyScore,
              locked: newStatus !== MatchStatus.UPCOMING,
            },
          });
          created++;
          console.log(`[sync] Created ${homeCode} vs ${awayCode} (${newStatus})`);
        }
      } catch (e) {
        console.error(`[sync] Failed to create ${homeCode} vs ${awayCode}:`, e);
        errors++;
      }
    }
  }

  // ── Auto-settlement ───────────────────────────────────────────────────────────
  // Find all FINISHED matches with scores that were just synced (or were already in DB)
  // and haven't been settled yet (no MatchAward records exist).
  let settled = 0;
  let settleErrors = 0;

  const finishedMatches = await prisma.match.findMany({
    where: {
      tournamentId: activeTournament.id,
      status: MatchStatus.FINISHED,
      homeScore: { not: null },
      awayScore: { not: null },
    },
    include: {
      predictions: true,
      homeTeam: true,
      awayTeam: true,
      awards: { select: { id: true } }, // empty = not settled yet
    },
  });

  for (const match of finishedMatches) {
    // Skip if already settled
    if (match.awards.length > 0) continue;

    const leagues = await prisma.league.findMany({
      where: { tournamentId: activeTournament.id },
      select: { id: true },
    });

    for (const league of leagues) {
      // Gather predictions for this match in this league
      const picks: Pick[] = match.predictions
        .filter((p) => p.leagueId === league.id)
        .map((p) => ({
          userId: p.userId,
          home: p.homeScore,
          away: p.awayScore,
          penaltyWinnerId: p.penaltyWinnerId ?? undefined,
        }));

      if (picks.length === 0) continue;

      const awards = scoreLeague(
        match.homeScore!,
        match.awayScore!,
        picks,
        match.homePenaltyScore,
        match.awayPenaltyScore,
        match.homeTeamId ?? undefined,
        match.awayTeamId ?? undefined
      );

      // Store awards per user per match per league
      for (const award of awards) {
        await prisma.matchAward.upsert({
          where: {
            leagueId_matchId: {
              leagueId: league.id,
              matchId: match.id,
            },
          },
          update: { userId: award.userId, points: award.points, reason: award.reason as any },
          create: {
            leagueId: league.id,
            matchId: match.id,
            userId: award.userId,
            points: award.points,
            reason: award.reason as any,
          },
        });

        // Update member points tally
        await prisma.leagueMember.updateMany({
          where: { leagueId: league.id, userId: award.userId },
          data: { role: "MEMBER" }, // no-op update to touch the record; actual points tracked via MatchAward aggregate
        });
      }
      settled++;
    }
  }

  await prisma.syncLog.create({
    data: {
      triggered: "cron",
      matches: updated + created,
      created,
      updated,
      settled,
      errors: errors + settleErrors,
    },
  });

  return NextResponse.json({
    success: true,
    updated,
    created,
    errors,
    settled,
    settleErrors,
    message: `Sync: ${updated} updated, ${created} created. Settlement: ${settled} awards recorded.`,
  });
}
