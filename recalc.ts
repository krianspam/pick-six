import { PrismaClient } from '@prisma/client'
import { scoreLeague } from './lib/scoring'

const prisma = new PrismaClient()

async function main() {
  const matches = await prisma.match.findMany({
    where: { status: 'FINISHED' },
    include: { predictions: true, awards: true }
  })
  
  for (const match of matches) {
    if (match.homeScore === null || match.awayScore === null) continue;
    
    // Group predictions by league
    const byLeague = new Map();
    for (const p of match.predictions) {
      if (!byLeague.has(p.leagueId)) byLeague.set(p.leagueId, []);
      byLeague.get(p.leagueId).push({
        userId: p.userId,
        home: p.homeScore,
        away: p.awayScore,
        penaltyWinnerId: p.penaltyWinnerId
      });
    }

    // Delete existing awards for this match
    await prisma.matchAward.deleteMany({
      where: { matchId: match.id }
    });

    for (const [leagueId, picks] of byLeague.entries()) {
      const awards = scoreLeague(
        match.homeScore, 
        match.awayScore, 
        picks, 
        match.homePenaltyScore, 
        match.awayPenaltyScore, 
        match.homeTeamId || undefined, 
        match.awayTeamId || undefined
      );
      
      for (const a of awards) {
        await prisma.matchAward.create({
          data: {
            leagueId,
            matchId: match.id,
            userId: a.userId,
            points: a.points,
            reason: a.reason.toUpperCase().replace(/\s/g, '_').split('+')[0].trim() as any
          }
        });
      }
    }
  }
  console.log('Recalculated all finished matches with new rules.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
