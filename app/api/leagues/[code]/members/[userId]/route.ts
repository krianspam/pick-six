import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ code: string; userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, userId } = await context.params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const league = await prisma.league.findUnique({
      where: { code: code.toUpperCase() },
      include: { members: true },
    });

    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    if (league.ownerId !== user.id && user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized to remove this member" }, { status: 403 });
    }

    if (league.ownerId === userId) {
      const otherMembers = league.members
        .filter(m => m.userId !== userId)
        .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
        
      if (otherMembers.length > 0) {
        // Transfer ownership to the earliest joined member
        await prisma.league.update({
          where: { id: league.id },
          data: { ownerId: otherMembers[0].userId }
        });
      } else {
        // If owner is the only member, just delete the league entirely
        await prisma.league.delete({ where: { id: league.id } });
        return NextResponse.json({ success: true });
      }
    }

    // Delete the member
    await prisma.leagueMember.delete({
      where: {
        leagueId_userId: {
          leagueId: league.id,
          userId: userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
