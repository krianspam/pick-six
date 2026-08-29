import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const matches = await prisma.match.findMany({
    where: {
      homeTeam: { name: 'Mexico' },
      awayTeam: { name: 'England' }
    }
  })
  
  const upcoming = matches.find(m => m.status === 'UPCOMING')
  const finished = matches.find(m => m.status === 'FINISHED')

  if (upcoming && finished) {
    // Update the upcoming one to finished with the scores from the finished one
    await prisma.match.update({
      where: { id: upcoming.id },
      data: {
        status: 'FINISHED',
        homeScore: finished.homeScore,
        awayScore: finished.awayScore,
        locked: true
      }
    })
    
    // Delete the duplicate finished one
    await prisma.match.delete({
      where: { id: finished.id }
    })
    console.log('Fixed duplicate Mexico vs England matches. Updated the correct one to FINISHED (2-3) and deleted the duplicate.')
  } else if (upcoming && !finished) {
    console.log('Found only upcoming match, we need to know the score to finish it.')
  } else {
    console.log('No fix needed or structure is different.')
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
