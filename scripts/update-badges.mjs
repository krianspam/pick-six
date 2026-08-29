// Update team badge URLs in DB
// Run: node scripts/update-badges.mjs

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TOURNAMENT_ID = 'cmsm4d7pj00012r3qqtqi6mxn';

// Badge URLs — Wikimedia Commons / Wikipedia uploads (120px thumbnails)
// Sorted by code for easy lookup
const BADGES = {
  AEK:   'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/AEK_BC_%28logo_2019%29.svg/120px-AEK_BC_%28logo_2019%29.svg.png',
  ARS:   'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/120px-Arsenal_FC.svg.png',
  AVL:   'https://upload.wikimedia.org/wikipedia/en/thumb/f/f9/Aston_Villa_F.C._logo_%282016%29.svg/120px-Aston_Villa_F.C._logo_%282016%29.svg.png',
  ATL:   'https://upload.wikimedia.org/wikipedia/en/thumb/6/6b/Atletico_Madrid_Logo_2024.svg/120px-Atletico_Madrid_Logo_2024.svg.png',
  BAR:   'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/120px-FC_Barcelona_%28crest%29.svg.png',
  BAY:   'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg/120px-FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg.png',
  BOD:   'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Bod%C3%B8_Glimt_logo.svg/120px-Bod%C3%B8_Glimt_logo.svg.png',
  BRU:   'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Club_Brugge_KV_logo.svg/120px-Club_Brugge_KV_logo.svg.png',
  BET:   'https://upload.wikimedia.org/wikipedia/en/thumb/4/4a/Real_Betis_logo.svg/120px-Real_Betis_logo.svg.png',
  BVB:   'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/120px-Borussia_Dortmund_logo.svg.png',
  COM:   'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Como_1907_Logo.svg/120px-Como_1907_Logo.svg.png',
  FEN:   'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Fenerbah%C3%A7e_SK_logo.svg/120px-Fenerbah%C3%A7e_SK_logo.svg.png',
  FPI:   'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Feyenoord_logo.svg/120px-Feyenoord_logo.svg.png',
  GAL:   'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Galatasaray_Sports_Club_logo.svg/120px-Galatasaray_Sports_Club_logo.svg.png',
  INT:   'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/FC_Internazionale_Milano_2021.svg/120px-FC_Internazionale_Milano_2021.svg.png',
  LASK:  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/LASK_Logo.svg/120px-LASK_Logo.svg.png',
  LEN:   'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/RC_Lens_logo.svg/120px-RC_Lens_logo.svg.png',
  LIL:   'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/LOSC_Lille_logo_2018.svg/120px-LOSC_Lille_logo_2018.svg.png',
  LIV:   'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/120px-Liverpool_FC.svg.png',
  MCI:   'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/120px-Manchester_City_FC_badge.svg.png',
  MUN:   'https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/120px-Manchester_United_FC_crest.svg.png',
  NAP:   'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/SSC_Napoli_logo.svg/120px-SSC_Napoli_logo.svg.png',
  PSG:   'https://upload.wikimedia.org/wikipedia/en/thumb/8/89/Paris_Saint-Germain_F.C..svg/120px-Paris_Saint-Germain_F.C..svg.png',
  POR:   'https://upload.wikimedia.org/wikipedia/en/thumb/f/f1/FC_Porto.svg/120px-FC_Porto.svg.png',
  PSV:   'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/PSV_Eindhoven_logo.svg/120px-PSV_Eindhoven_logo.svg.png',
  RBL:   'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/RB_Leipzig_2014_logo.svg/120px-RB_Leipzig_2014_logo.svg.png',
  RMA:   'https://upload.wikimedia.org/wikipedia/en/thumb/c/c7/Real_Madrid_CF.svg/120px-Real_Madrid_CF.svg.png',
  ROM:   'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/AS_Roma_Logo_2017.svg/120px-AS_Roma_Logo_2017.svg.png',
  SAB:   'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Sabah_FK_2022.svg/120px-Sabah_FK_2022.svg.png',
  SHK:   'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/FC_Shakhtar_Donetsk_Logo.svg/120px-FC_Shakhtar_Donetsk_Logo.svg.png',
  SLO:   'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/%C5%A0K_Slovan_Bratislava_logo.svg/120px-%C5%A0K_Slovan_Bratislava_logo.svg.png',
  SLP:   'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/SK_Slavia_Prague_logo.svg/120px-SK_Slavia_Prague_logo.svg.png',
  SP:    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sporting_Clube_de_Portugal_2026.svg/120px-Sporting_Clube_de_Portugal_2026.svg.png',
  STU:   'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/VfB_Stuttgart_1893_Logo.svg/120px-VfB_Stuttgart_1893_Logo.svg.png',
  VIK:   'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Viking_FK_logo.svg/120px-Viking_FK_logo.svg.png',
  VIL:   'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Villarreal_CF_logo.svg/120px-Villarreal_CF_logo.svg.png',
};

async function main() {
  const teams = await prisma.team.findMany({ where: { tournamentId: TOURNAMENT_ID } });
  let updated = 0;

  for (const team of teams) {
    const url = BADGES[team.code];
    if (!url) {
      console.log(`  [SKIP] ${team.code} — no badge URL configured`);
      continue;
    }
    if (team.flagUrl === url) {
      console.log(`  [SAME] ${team.code}`);
      continue;
    }
    await prisma.team.update({ where: { id: team.id }, data: { flagUrl: url } });
    console.log(`  [OK] ${team.code}: ${url.split('/').pop()}`);
    updated++;
  }

  console.log(`\nDone. ${updated} teams updated.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
