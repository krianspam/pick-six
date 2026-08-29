import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const preds = await prisma.prediction.findMany();
  console.log(`Found ${preds.length} predictions.`);
  if (preds.length > 0) {
    console.log(JSON.stringify(preds, null, 2));
  }
}
main().finally(() => prisma.$disconnect())
