const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({ orderBy: { kickoff: 'asc' } });
  
  if (matches.length === 0) {
    console.log("No matches found.");
    return;
  }

  // Set the first match to kickoff in 1 hour
  let baseTime = new Date();
  baseTime.setHours(baseTime.getHours() + 1);

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    
    // Add 2 hours for each subsequent match
    const newKickoff = new Date(baseTime.getTime() + i * 2 * 60 * 60 * 1000);
    
    await prisma.match.update({
      where: { id: match.id },
      data: { kickoff: newKickoff }
    });
    
    console.log(`Updated match ${match.homeId} vs ${match.awayId} to ${newKickoff.toISOString()}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
