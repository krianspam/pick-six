import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const users = await prisma.user.findMany();
  const leagues = await prisma.league.findMany();
  const leagueMembers = await prisma.leagueMember.findMany();
  const predictions = await prisma.prediction.findMany();
  const matchAwards = await prisma.matchAward.findMany();
  const tournaments = await prisma.tournament.findMany();

  console.log({
    users: users.length,
    leagues: leagues.length,
    leagueMembers: leagueMembers.length,
    predictions: predictions.length,
    matchAwards: matchAwards.length,
    tournaments: tournaments.length,
  });
  if (matchAwards.length > 0) {
    console.log(matchAwards);
  }
}
main().finally(() => prisma.$disconnect())
