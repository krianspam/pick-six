const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const matches = await prisma.match.findMany({
    where: { stage: 'ROUND_OF_32' },
    include: { homeTeam: true, awayTeam: true }
  });
  console.log(JSON.stringify(matches.map(m => ({ home: m.homeTeam?.name, away: m.awayTeam?.name })), null, 2));
}
main();
