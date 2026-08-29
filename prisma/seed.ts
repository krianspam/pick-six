import { PrismaClient, Stage, MatchStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // World Cup removed per user request

  const championsLeague = await prisma.tournament.upsert({
    where: { slug: "champions-league-2026" },
    update: { active: true },
    create: {
      name: "Champions League 2026/27",
      slug: "champions-league-2026",
      year: 2026,
      startsAt: new Date("2026-09-15T00:00:00Z"),
      endsAt: new Date("2027-05-30T00:00:00Z"),
      active: true,
    },
  });

  console.log(`Tournaments loaded: ${championsLeague.name}`);

  console.log(`Tournaments created/loaded successfully.`);

  // World Cup teams removed
  // Pull the 36 CL teams directly from the football-data API for the active season.
  // This mirrors SEASON_ID in the sync route — update there and re-run this to refresh.
  const SEASON_ID = parseInt(process.env.SEED_SEASON_ID ?? "2454");
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;

  let clTeamsData: { code: string; name: string; flagUrl: string }[] = [];

  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.football-data.org/v4/competitions/2001/teams?season=${SEASON_ID}`,
        { headers: { "X-Auth-Token": apiKey } }
      );
      if (res.ok) {
        const data = await res.json();
        clTeamsData = (data.teams ?? []).map((t: any) => ({
          code: t.tla,
          name: t.shortName ?? t.name,
          flagUrl: t.crest ?? "",
        }));
        console.log(`Fetched ${clTeamsData.length} teams from football-data (season ${SEASON_ID})`);
      } else {
        console.warn(`football-data teams fetch failed: ${res.status} — falling back to built-in list`);
      }
    } catch (e) {
      console.warn("Failed to fetch teams from API:", e);
    }
  }

  // Fallback static list if no API key (development / offline)
  if (!clTeamsData.length) {
    console.warn("Using built-in fallback team list — run with FOOTBALL_DATA_API_KEY for accurate teams");
    clTeamsData = [
      { code: "RMA", name: "Real Madrid", flagUrl: "🇪🇸" },
      { code: "MCI", name: "Manchester City", flagUrl: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { code: "BAY", name: "Bayern Munich", flagUrl: "🇩🇪" },
      { code: "BAR", name: "Barcelona", flagUrl: "🇪🇸" },
      { code: "ARS", name: "Arsenal", flagUrl: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { code: "PSG", name: "Paris Saint-Germain", flagUrl: "🇫🇷" },
      { code: "JUV", name: "Juventus", flagUrl: "🇮🇹" },
      { code: "INT", name: "Inter Milan", flagUrl: "🇮🇹" },
      { code: "LIV", name: "Liverpool", flagUrl: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { code: "CHE", name: "Chelsea", flagUrl: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { code: "BVB", name: "Borussia Dortmund", flagUrl: "🇩🇪" },
      { code: "ATL", name: "Atletico Madrid", flagUrl: "🇪🇸" },
      { code: "BEN", name: "Benfica", flagUrl: "🇵🇹" },
      { code: "PSV", name: "PSV Eindhoven", flagUrl: "🇳🇱" },
      { code: "ASM", name: "Monaco", flagUrl: "🇫🇷" },
      { code: "FPI", name: "Feyenoord", flagUrl: "🇳🇱" },
      { code: "SP", name: "Sporting CP", flagUrl: "🇵🇹" },
    ];
  }

  const clTeams: Record<string, any> = {};
  for (const team of clTeamsData) {
    const t = await prisma.team.upsert({
      where: {
        tournamentId_code: {
          tournamentId: championsLeague.id,
          code: team.code,
        },
      },
      update: {
        name: team.name,
        flagUrl: team.flagUrl,
      },
      create: {
        tournamentId: championsLeague.id,
        code: team.code,
        name: team.name,
        flagUrl: team.flagUrl,
      },
    });
    clTeams[team.code] = t;
  }

  console.log("Teams seeded successfully.");

  // World Cup groups removed

  const clGroup = await prisma.group.upsert({
    where: {
      tournamentId_name: {
        tournamentId: championsLeague.id,
        name: "League Phase",
      },
    },
    update: {},
    create: {
      tournamentId: championsLeague.id,
      name: "League Phase",
    },
  });

  console.log("Groups seeded successfully.");

  // World Cup matches removed

  const clMatchesData: any[] = []; // Matches will be added once the draw is finalised

  for (const m of clMatchesData) {
    await prisma.match.upsert({
      where: { id: m.id },
      update: {
        status: m.status,
        homeScore: m.homeScore ?? null,
        awayScore: m.awayScore ?? null,
        kickoff: m.kickoff,
      },
      create: {
        id: m.id,
        tournamentId: championsLeague.id,
        stage: m.stage,
        groupName: m.groupName,
        homeTeamId: clTeams[m.homeCode].id,
        awayTeamId: clTeams[m.awayCode].id,
        kickoff: m.kickoff,
        venue: m.venue,
        status: m.status,
        homeScore: m.homeScore ?? null,
        awayScore: m.awayScore ?? null,
      },
    });
  }

  // Removed destructive match deletion logic to protect production data

  console.log("Matches seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
