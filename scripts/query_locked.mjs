import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const matches = await prisma.match.findMany({
    where: { status: 'UPCOMING' }
  });
  console.log(matches.map(m => ({ id: m.id, locked: m.locked })));
}
main().finally(() => prisma.$disconnect())
