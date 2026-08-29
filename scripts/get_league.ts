import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const league = await prisma.league.findFirst()
  console.log(league?.code)
}

main().catch(console.error).finally(() => prisma.$disconnect())
