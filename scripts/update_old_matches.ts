import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const matches = await prisma.match.findMany({
    where: {
      status: { not: 'FINISHED' }
    }
  })

  const now = new Date()

  for (const m of matches) {
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
    
    if (m.kickoff <= twoHoursAgo) {
      let hs = m.homeScore ?? Math.floor(Math.random() * 3)
      let as = m.awayScore ?? Math.floor(Math.random() * 3)

      if (m.id === 'm_tun_jpn') { hs = 0; as = 2; }
      if (m.id === 'm_ecu_cuw') { hs = 0; as = 0; }

      await prisma.match.update({
        where: { id: m.id },
        data: {
          status: 'FINISHED',
          locked: true,
          homeScore: hs,
          awayScore: as
        }
      })
      console.log(`Updated ${m.id} to FINISHED (${hs}-${as})`)
    } else if (m.kickoff <= now) {
      await prisma.match.update({
        where: { id: m.id },
        data: {
          status: 'LIVE',
          locked: true
        }
      })
      console.log(`Updated ${m.id} to LIVE`)
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
