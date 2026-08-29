import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const createLeague = z.object({ 
  name: z.string().trim().min(2).max(40), 
  tournamentId: z.string().optional() 
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.leagueMember.findMany({
      where: { userId: session.user.id },
      include: {
        league: {
          include: {
            members: {
              include: { user: true }
            },
            tournament: true
          }
        }
      }
    });

    const leagues = memberships.map(m => m.league);
    return NextResponse.json(leagues);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createLeague.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid league details", fields: parsed.error.flatten().fieldErrors }, 
        { status: 400 }
      );
    }
    
    let tId = parsed.data.tournamentId;
    if (!tId) {
      const activeTournament = await prisma.tournament.findFirst({ where: { active: true } });
      if (!activeTournament) {
        return NextResponse.json({ error: "No active tournament found" }, { status: 500 });
      }
      tId = activeTournament.id;
    }

    const code = `${parsed.data.name.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 6)}${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
    const league = await prisma.league.create({ 
      data: { 
        name: parsed.data.name, 
        ownerId: session.user.id, 
        tournamentId: tId, 
        code, 
        members: { 
          create: { 
            userId: session.user.id, 
            role: "OWNER" 
          } 
        } 
      }, 
      include: { 
        members: {
          include: { user: true }
        },
        tournament: true
      } 
    });
    return NextResponse.json(league, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
