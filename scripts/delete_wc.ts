import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const wc = await prisma.tournament.findUnique({
    where: { slug: "world-cup-2026" }
  });

  if (!wc) {
    console.log("World cup not found");
    return;
  }

  // Delete all World Cup leagues (and their members, predictions, awards via cascade)
  const leagues = await prisma.league.findMany({ where: { tournamentId: wc.id } });
  for (const l of leagues) {
    await prisma.league.delete({ where: { id: l.id } });
  }

  // Delete all WC matches (and predictions, awards via cascade)
  await prisma.match.deleteMany({ where: { tournamentId: wc.id } });

  // Delete all WC teams and groups
  await prisma.standing.deleteMany({ where: { team: { tournamentId: wc.id } } });
  await prisma.team.deleteMany({ where: { tournamentId: wc.id } });
  await prisma.group.deleteMany({ where: { tournamentId: wc.id } });

  // Finally delete the tournament
  await prisma.tournament.delete({ where: { id: wc.id } });

  console.log("World Cup data successfully deleted.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
