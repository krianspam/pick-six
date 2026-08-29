import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const matches = await prisma.match.findMany({
    where: { status: 'FINISHED' },
    select: { id: true, homeScore: true, awayScore: true, predictions: true }
  });
  console.log(`Found ${matches.length} finished matches.`);
  if (matches.length > 0) {
    console.log(JSON.stringify(matches, null, 2));
  }
}
main().finally(() => prisma.$disconnect())
