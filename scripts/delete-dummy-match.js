const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.match.deleteMany({
    where: {
      id: "m_usa_par"
    }
  });
  console.log("Deleted USA vs PAR match");
}

main().catch(console.error).finally(() => prisma.$disconnect());
