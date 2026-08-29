import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  await prisma.prediction.deleteMany()
  console.log("Deleted all predictions")
}
main().finally(() => prisma.$disconnect())
