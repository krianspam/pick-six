import { PrismaClient, Stage, MatchStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tournament = await prisma.tournament.findUnique({ where: { slug: "world-cup-2026" } });
  if (!tournament) throw new Error("Tournament not found");
  
  // Add South Africa and Canada, and a couple more to make 32 total teams
  const newTeams = [
    { code: "RSA", name: "South Africa", flagUrl: "🇿🇦" },
    { code: "CAN", name: "Canada", flagUrl: "🇨🇦" },
    { code: "ENG", name: "England", flagUrl: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { code: "ITA", name: "Italy", flagUrl: "🇮🇹" },
  ];

  for (const team of newTeams) {
    await prisma.team.upsert({
      where: {
        tournamentId_code: {
          tournamentId: tournament.id,
          code: team.code,
        },
      },
      update: {},
      create: {
        tournamentId: tournament.id,
        code: team.code,
        name: team.name,
        flagUrl: team.flagUrl,
      },
    });
  }

  // Get all teams
  const allTeams = await prisma.team.findMany({ where: { tournamentId: tournament.id } });
  // We should have 32 teams now.
  const teamIds = allTeams.map(t => t.id);

  // Generate 16 matches for Round of 32
  let baseTime = new Date();
  baseTime.setHours(baseTime.getHours() + 1); // Next match in 1 hour
  
  const matchesToCreate = [];
  
  for (let i = 0; i < 16; i++) {
    const homeTeamId = teamIds[i * 2];
    const awayTeamId = teamIds[i * 2 + 1];
    const kickoff = new Date(baseTime.getTime() + i * 2 * 60 * 60 * 1000);
    
    matchesToCreate.push({
      id: `m_r32_${i + 1}`,
      tournamentId: tournament.id,
      stage: 'ROUND_OF_32' as Stage,
      homeTeamId,
      awayTeamId,
      kickoff,
      venue: "Round of 32 Stadium",
      status: 'UPCOMING' as MatchStatus,
    });
  }

  // Insert matches
  for (const m of matchesToCreate) {
    await prisma.match.upsert({
      where: { id: m.id },
      update: { kickoff: m.kickoff, status: m.status },
      create: m
    });
  }
  
  console.log("Generated 16 Round of 32 matches!");
}

main().finally(() => prisma.$disconnect());
