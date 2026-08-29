import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TEAMS_25_26 = [
  { code: "PSG",  name: "Paris Saint-Germain",  flag: "🇫🇷" },
  { code: "BAY",  name: "Bayern Munich",         flag: "🇩🇪" },
  { code: "RMA",  name: "Real Madrid",           flag: "🇪🇸" },
  { code: "LIV",  name: "Liverpool",             flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "INT",  name: "Inter Milan",           flag: "🇮🇹" },
  { code: "MCI",  name: "Manchester City",       flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "ARS",  name: "Arsenal",               flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "BAR",  name: "Barcelona",              flag: "🇪🇸" },
  { code: "ATL",  name: "Atlético Madrid",       flag: "🇪🇸" },
  { code: "BVB",  name: "Borussia Dortmund",      flag: "🇩🇪" },
  { code: "ROM",  name: "Roma",                  flag: "🇮🇹" },
  { code: "SP",   name: "Sporting CP",           flag: "🇵🇹" },
  { code: "POR",  name: "Porto",                 flag: "🇵🇹" },
  { code: "MUN",  name: "Manchester United",     flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "BRU",  name: "Club Brugge",           flag: "🇧🇪" },
  { code: "BET",  name: "Real Betis",            flag: "🇪🇸" },
  { code: "PSV",  name: "PSV Eindhoven",         flag: "🇳🇱" },
  { code: "AVL",  name: "Aston Villa",           flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "FPI",  name: "Feyenoord",             flag: "🇳🇱" },
  { code: "LIL",  name: "Lille",                flag: "🇫🇷" },
  { code: "BOD",  name: "Bodø/Glimt",           flag: "🇳🇴" },
  { code: "NAP",  name: "Napoli",                flag: "🇮🇹" },
  { code: "RBL",  name: "RB Leipzig",           flag: "🇩🇪" },
  { code: "VIL",  name: "Villarreal",           flag: "🇪🇸" },
  { code: "FEN",  name: "Fenerbahçe",           flag: "🇹🇷" },
  { code: "SHK",  name: "Shakhtar Donetsk",     flag: "🇺🇦" },
  { code: "GAL",  name: "Galatasaray",           flag: "🇹🇷" },
  { code: "SLP",  name: "Slavia Prague",         flag: "🇨🇿" },
  { code: "SLO",  name: "Slovan Bratislava",    flag: "🇸🇰" },
  { code: "STU",  name: "Stuttgart",             flag: "🇩🇪" },
  { code: "AEK",  name: "AEK Athens",           flag: "🇬🇷" },
  { code: "LASK", name: "LASK",                  flag: "🇦🇹" },
  { code: "COM",  name: "Como",                  flag: "🇮🇹" },
  { code: "LEN",  name: "Lens",                  flag: "🇫🇷" },
  { code: "VIK",  name: "Viking",                flag: "🇳🇴" },
  { code: "SAB",  name: "Sabah",                 flag: "🇦🇿" },
];

const t = await prisma.tournament.findFirst({ where: { active: true } });
if (!t) { console.error("No active tournament"); process.exit(1); }

// Delete ALL existing teams for this tournament
await prisma.team.deleteMany({ where: { tournamentId: t.id } });
console.log("Cleared old teams");

// Insert correct 36
for (const team of TEAMS_25_26) {
  await prisma.team.create({ data: { tournamentId: t.id, code: team.code, name: team.name, flagUrl: team.flag } });
}
console.log(`Inserted ${TEAMS_25_26.length} teams`);

const total = await prisma.team.count({ where: { tournamentId: t.id } });
console.log(`Total in DB: ${total}`);
await prisma.$disconnect();
