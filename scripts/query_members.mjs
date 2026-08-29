import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const members = await prisma.leagueMember.findMany({ include: { user: true, league: true } });
  console.log(JSON.stringify(members, null, 2));
}
main().finally(() => prisma.$disconnect())
