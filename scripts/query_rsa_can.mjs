import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const teams = await prisma.team.findMany({
    where: { OR: [{ name: { contains: 'South Africa' } }, { name: { contains: 'Canada' } }] }
  });
  console.log('Teams:', teams);
  
  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true }
  });
  const filtered = matches.filter(m => 
    m.homeTeam.name.includes('South Africa') || m.awayTeam.name.includes('South Africa') ||
    m.homeTeam.name.includes('Canada') || m.awayTeam.name.includes('Canada')
  );
  console.log('Matches:', filtered);
}
main().finally(() => prisma.$disconnect())
