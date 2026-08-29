import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { MatchStatus, Stage } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") as MatchStatus | null;
    const stage = searchParams.get("stage") as Stage | null;
    const tournamentId = searchParams.get("tournamentId");

    const where: any = {};
    if (status) where.status = status;
    if (stage) where.stage = stage;
    if (tournamentId) where.tournamentId = tournamentId;

    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        predictions: session?.user?.id
          ? {
              where: { userId: session.user.id },
            }
          : false,
      },
      orderBy: {
        kickoff: "asc",
      },
    });

    // Remap team flag URLs to `flag` for frontend compatibility
    const remapped = matches.map((m: any) => ({
      ...m,
      homeTeam: m.homeTeam ? { ...m.homeTeam, flag: m.homeTeam.flagUrl || m.homeTeam.flag || "" } : null,
      awayTeam: m.awayTeam ? { ...m.awayTeam, flag: m.awayTeam.flagUrl || m.awayTeam.flag || "" } : null,
    }));

    return NextResponse.json(remapped);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
