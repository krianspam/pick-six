import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  await prisma.match.deleteMany({
    where: { id: { startsWith: 'm_r32_' } }
  });
  console.log("Deleted random R32 matches");
}
main().finally(() => prisma.$disconnect())
