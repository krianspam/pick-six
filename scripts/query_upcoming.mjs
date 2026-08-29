import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const matches = await prisma.match.findMany({
    where: { status: 'UPCOMING' },
    orderBy: { kickoff: 'asc' }
  });
  console.log(matches.map(m => ({ id: m.id, kickoff: m.kickoff, status: m.status })));
}
main().finally(() => prisma.$disconnect())
