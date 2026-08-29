import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tournament = await prisma.tournament.findUnique({ where: { slug: "world-cup-2026" } });
  
  // From the API fetch we saw these teams in LAST_32:
  // RSA, CAN, BRA, JPN, GER, PAR, NED, MAR, CIV, NOR, FRA, SWE, MEX, ECU, ENG, COD, BEL, SEN, USA, BIH, ESP, AUT, POR, CRO, SUI, ALG, AUS, EGY, ARG, CPV, COL, GHA
  const teams = [
    { code: 'RSA', name: 'South Africa', flagUrl: '🇿🇦' },
    { code: 'CAN', name: 'Canada', flagUrl: '🇨🇦' },
    { code: 'BRA', name: 'Brazil', flagUrl: '🇧🇷' },
    { code: 'JPN', name: 'Japan', flagUrl: '🇯🇵' },
    { code: 'GER', name: 'Germany', flagUrl: '🇩🇪' },
    { code: 'PAR', name: 'Paraguay', flagUrl: '🇵🇾' },
    { code: 'NED', name: 'Netherlands', flagUrl: '🇳🇱' },
    { code: 'MAR', name: 'Morocco', flagUrl: '🇲🇦' },
    { code: 'CIV', name: 'Ivory Coast', flagUrl: '🇨🇮' },
    { code: 'NOR', name: 'Norway', flagUrl: '🇳🇴' },
    { code: 'FRA', name: 'France', flagUrl: '🇫🇷' },
    { code: 'SWE', name: 'Sweden', flagUrl: '🇸🇪' },
    { code: 'MEX', name: 'Mexico', flagUrl: '🇲🇽' },
    { code: 'ECU', name: 'Ecuador', flagUrl: '🇪🇨' },
    { code: 'ENG', name: 'England', flagUrl: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { code: 'COD', name: 'DR Congo', flagUrl: '🇨🇩' },
    { code: 'BEL', name: 'Belgium', flagUrl: '🇧🇪' },
    { code: 'SEN', name: 'Senegal', flagUrl: '🇸🇳' },
    { code: 'USA', name: 'United States', flagUrl: '🇺🇸' },
    { code: 'BIH', name: 'Bosnia & H.', flagUrl: '🇧🇦' },
    { code: 'ESP', name: 'Spain', flagUrl: '🇪🇸' },
    { code: 'AUT', name: 'Austria', flagUrl: '🇦🇹' },
    { code: 'POR', name: 'Portugal', flagUrl: '🇵🇹' },
    { code: 'CRO', name: 'Croatia', flagUrl: '🇭🇷' },
    { code: 'SUI', name: 'Switzerland', flagUrl: '🇨🇭' },
    { code: 'ALG', name: 'Algeria', flagUrl: '🇩🇿' },
    { code: 'AUS', name: 'Australia', flagUrl: '🇦🇺' },
    { code: 'EGY', name: 'Egypt', flagUrl: '🇪🇬' },
    { code: 'ARG', name: 'Argentina', flagUrl: '🇦🇷' },
    { code: 'CPV', name: 'Cape Verde', flagUrl: '🇨🇻' },
    { code: 'COL', name: 'Colombia', flagUrl: '🇨🇴' },
    { code: 'GHA', name: 'Ghana', flagUrl: '🇬🇭' }
  ];

  let added = 0;
  for (const team of teams) {
    const existing = await prisma.team.findFirst({ where: { tournamentId: tournament.id, code: team.code } });
    if (!existing) {
      await prisma.team.create({
        data: {
          tournamentId: tournament.id,
          code: team.code,
          name: team.name,
          flagUrl: team.flagUrl
        }
      });
      added++;
    }
  }
  
  console.log(`Added ${added} missing teams.`);
}

main().finally(() => prisma.$disconnect())
