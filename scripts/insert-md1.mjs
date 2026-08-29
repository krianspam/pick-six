// Insert matchday 1 (17 Sept 2025) for UCL 2026/27 — Sept 8–10 2026
// Run: node scripts/insert-md1.mjs

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TOURNAMENT_ID = 'cmsm4d7pj00012r3qqtqi6mxn';

// 18 fixtures, Sept 8–10 2026
const FIXTURES = [
  // Matchday 1 — 8 Sept
  { home: 'BRU', away: 'AVL', kickoff: '2026-09-08T19:00:00Z', venue: 'Jan Breydel Stadion, Bruges' },
  { home: 'AEK', away: 'LASK', kickoff: '2026-09-08T19:00:00Z', venue: 'OPAP Arena, Athens' },
  { home: 'RMA', away: 'INT', kickoff: '2026-09-08T20:00:00Z', venue: 'Santiago Bernabéu, Madrid' },
  { home: 'POR', away: 'MCI', kickoff: '2026-09-08T20:00:00Z', venue: 'Estádio do Dragão, Porto' },
  { home: 'BVB', away: 'VIL', kickoff: '2026-09-08T20:00:00Z', venue: 'Signal Iduna Park, Dortmund' },
  { home: 'LIL', away: 'BET', kickoff: '2026-09-08T20:00:00Z', venue: 'Stade Pierre-Mauroy, Lille' },
  // Matchday 1 — 9 Sept
  { home: 'BAR', away: 'FPI', kickoff: '2026-09-09T19:00:00Z', venue: 'Estadi Olímpic Lluís Companys, Barcelona' },
  { home: 'STU', away: 'VIK', kickoff: '2026-09-09T19:00:00Z', venue: 'MHPArena, Stuttgart' },
  { home: 'LIV', away: 'ATL', kickoff: '2026-09-09T20:00:00Z', venue: 'Anfield, Liverpool' },
  { home: 'PSG', away: 'SLO', kickoff: '2026-09-09T20:00:00Z', venue: 'Parc des Princes, Paris' },
  { home: 'NAP', away: 'ARS', kickoff: '2026-09-09T20:00:00Z', venue: 'Stadio Diego Armando Maradona, Naples' },
  { home: 'SP', away: 'GAL', kickoff: '2026-09-09T20:00:00Z', venue: 'Estádio José Alvalade, Lisbon' },
  // Matchday 1 — 10 Sept
  { home: 'FEN', away: 'ROM', kickoff: '2026-09-10T19:00:00Z', venue: 'Beşiktaş Park, Istanbul' },
  { home: 'PSV', away: 'SHK', kickoff: '2026-09-10T19:00:00Z', venue: 'Philips Stadion, Eindhoven' },
  { home: 'BAY', away: 'BOD', kickoff: '2026-09-10T19:00:00Z', venue: 'Allianz Arena, Munich' },
  { home: 'MUN', away: 'SAB', kickoff: '2026-09-10T20:00:00Z', venue: 'Old Trafford, Manchester' },
  { home: 'COM', away: 'RBL', kickoff: '2026-09-10T20:00:00Z', venue: 'Stadio Giuseppe Sinigaglia, Como' },
  { home: 'SLP', away: 'LEN', kickoff: '2026-09-10T20:00:00Z', venue: 'Stadion Letná, Prague' },
];

async function main() {
  console.log('Fetching teams...');
  const teams = await prisma.team.findMany({ where: { tournamentId: TOURNAMENT_ID } });
  const byCode = Object.fromEntries(teams.map(t => [t.code, t]));

  const missing = FIXTURES.filter(f => !byCode[f.home] || !byCode[f.away]);
  if (missing.length) {
    console.error('Missing teams:', missing.map(f => `${f.home} / ${f.away}`));
    console.error('Available:', teams.map(t => t.code).join(', '));
    process.exit(1);
  }

  // Clear existing league-phase matches
  const deleted = await prisma.match.deleteMany({
    where: { tournamentId: TOURNAMENT_ID, stage: 'LEAGUE_PHASE' },
  });
  console.log(`Cleared ${deleted.count} existing matches.`);

  const created = [];
  for (const f of FIXTURES) {
    const homeTeam = byCode[f.home];
    const awayTeam = byCode[f.away];
    const id = `md1-${f.home}-${f.away}-2026`;
    const match = await prisma.match.create({
      data: {
        id,
        tournamentId: TOURNAMENT_ID,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        kickoff: new Date(f.kickoff),
        venue: f.venue,
        stage: 'LEAGUE_PHASE',
        groupName: null,
        status: 'UPCOMING',
        locked: false,
        homeScore: null,
        awayScore: null,
      },
    });
    created.push(match);
    console.log(`Created: ${homeTeam.name} vs ${awayTeam.name} — ${f.kickoff.slice(0,10)}`);
  }

  console.log(`\nDone. ${created.length} fixtures inserted.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
