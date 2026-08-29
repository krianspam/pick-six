import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const matches = await prisma.match.findMany({
    where: { stage: 'ROUND_OF_32' },
    select: { id: true, status: true, kickoff: true, homeTeam: { select: { code: true } }, awayTeam: { select: { code: true } } }
  });
  console.log(JSON.stringify(matches, null, 2));
}
main().finally(() => prisma.$disconnect())
