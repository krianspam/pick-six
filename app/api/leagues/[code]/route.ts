import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { scoreLeague, type Pick } from "@/lib/scoring";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const league = await prisma.league.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        tournament: true,
      },
    });

    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    // Fetch all matches for the tournament
    const dbMatches = await prisma.match.findMany({
      where: { tournamentId: league.tournamentId },
      include: {
        homeTeam: true,
        awayTeam: true,
        predictions: {
          where: { leagueId: league.id },
        },
      },
      orderBy: { kickoff: "asc" },
    });

    // Compute points from predictions on finished matches (we do this first to use the results in frontendMatches)
    const finishedMatches = dbMatches.filter((m) => m.status === "FINISHED");
    const memberUserIds = new Set(league.members.map((m) => m.userId));
    
    // Map of matchId -> Map of userId -> Award
    const matchAwards = new Map<string, Map<string, any>>();
    
    for (const match of finishedMatches) {
      if (match.homeScore === null || match.awayScore === null) continue;

      const picks: Pick[] = match.predictions
        .filter((p) => memberUserIds.has(p.userId))
        .map((p) => ({
          userId: p.userId,
          home: p.homeScore,
          away: p.awayScore,
          penaltyWinnerId: p.penaltyWinnerId
        }));

      const results = scoreLeague(
         match.homeScore, 
         match.awayScore, 
         picks, 
         match.homePenaltyScore, 
         match.awayPenaltyScore, 
         match.homeTeamId ?? undefined, 
         match.awayTeamId ?? undefined
      );
      const awardMap = new Map();
      for (const result of results) {
        awardMap.set(result.userId, result);
      }
      matchAwards.set(match.id, awardMap);
    }

    // Map database matches to the format expected by the frontend
    const frontendMatches = dbMatches.map((m) => {
      let matchPicks: any[] = [];
      if (m.predictions) {
        const awards = matchAwards.get(m.id);
        const isUpcoming = m.status === "UPCOMING";
        matchPicks = m.predictions
          .filter((p) => memberUserIds.has(p.userId))
          .map((p) => {
            const r = awards?.get(p.userId);
            return {
              userId: p.userId,
              home: isUpcoming ? null : p.homeScore,
              away: isUpcoming ? null : p.awayScore,
              points: r?.points || 0,
              reason: r?.reason || "none",
            };
          });
      }

      return {
        id: m.id,
        stage: m.stage,
        group: m.groupName,
        home: { code: m.homeTeam?.code || "", name: m.homeTeam?.name || "", flag: m.homeTeam?.flagUrl || "" },
        away: { code: m.awayTeam?.code || "", name: m.awayTeam?.name || "", flag: m.awayTeam?.flagUrl || "" },
        kickoff: m.kickoff.toISOString(),
        venue: m.venue,
        status: m.status.toLowerCase(),
        homeScore: m.homeScore ?? undefined,
        awayScore: m.awayScore ?? undefined,
        predictions: matchPicks,
      };
    });

    // Initialize stats for each member
    const memberStats = league.members.reduce((acc, member) => {
      // Create user name from email if not present
      const name = member.user.name || member.user.email.split("@")[0];
      const initials = name.slice(0, 2).toUpperCase();
      
      // Seed color based on userId length
      const colors = ["#d9ff57", "#ff8f79", "#9fbcff", "#f6c85f", "#c7a7ff", "#ffd1a9", "#a8ffd3"];
      const colorIndex = member.userId.charCodeAt(0) % colors.length;
      
      acc[member.userId] = {
        id: member.userId,
        name: name,
        initials: initials,
        color: colors[colorIndex],
        points: 0,
        exact: 0,
        gd: 0,
        close: 0,
      };
      return acc;
    }, {} as Record<string, any>);

    // Apply points
    for (const [matchId, awards] of Array.from(matchAwards.entries())) {
      for (const result of Array.from(awards.values())) {
        if (memberStats[result.userId]) {
          memberStats[result.userId].points += result.points;
          if (result.reason === "exact") memberStats[result.userId].exact++;
          if (result.reason === "goal_difference") memberStats[result.userId].gd++;
          if (result.reason === "closest") memberStats[result.userId].close++;
        }
      }
    }

    // Sort members by points desc, then exact desc
    const sortedMembers = Object.values(memberStats).sort((a: any, b: any) => b.points - a.points || b.exact - a.exact);

    return NextResponse.json({
      id: league.id,
      name: league.name,
      code: league.code,
      ownerId: league.ownerId,
      createdAt: league.createdAt.toISOString(),
      members: sortedMembers,
      matches: frontendMatches,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await context.params;

    const league = await prisma.league.findUnique({
      where: { code },
    });

    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    if (league.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only the league owner can delete the league" }, { status: 403 });
    }

    await prisma.league.delete({
      where: { code },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
