import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const matches = await prisma.match.findMany({
    where: { status: 'UPCOMING' },
    select: { id: true, kickoff: true }
  });
  console.log(matches);
}
main().finally(() => prisma.$disconnect())
