import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const matches = await prisma.match.updateMany({
    where: { 
      status: 'UPCOMING',
      stage: 'GROUP'
    },
    data: {
      stage: 'ROUND_OF_32'
    }
  });
  console.log(`Fixed ${matches.count} matches.`);
}
main().finally(() => prisma.$disconnect())
