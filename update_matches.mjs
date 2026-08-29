import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true }
  })
  
  for (const match of matches) {
    if (match.homeTeam?.name === 'Mexico' && match.awayTeam?.name === 'England') {
      console.log('Mexico vs England:', match)
      // I need the actual score for Mexico vs England. Let's assume the user's prediction (1-3) might not be it, I should just ask the user or wait, did the user mean the 1-3 is the final score?
    }
    if (match.homeTeam?.name === 'Australia' && match.awayTeam?.name === 'Egypt') {
      console.log('Australia vs Egypt:', match)
      await prisma.match.update({
        where: { id: match.id },
        data: {
          homeScore: 1,
          awayScore: 1,
          homePenaltyScore: 2,
          awayPenaltyScore: 4,
          status: 'FINISHED'
        }
      })
      console.log('Updated Australia vs Egypt to 1-1 (2-4 on pens)')
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
