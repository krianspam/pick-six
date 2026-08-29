import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await context.params;
  const league = await prisma.league.findUnique({ where: { code: code.toUpperCase() }, include: { _count: { select: { members: true } } } });
  
  if (!league) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (league._count.members >= league.maxMembers) return NextResponse.json({ error: "This league is full" }, { status: 409 });
  
  const existingMember = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: league.id, userId: session.user.id } }
  });

  if (existingMember) {
    return NextResponse.json({ joined: true, leagueId: league.id, alreadyMember: true });
  }

  await prisma.leagueMember.create({ 
    data: { leagueId: league.id, userId: session.user.id } 
  });
  
  return NextResponse.json({ joined: true, leagueId: league.id });
}
