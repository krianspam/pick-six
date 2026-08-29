// Update team badge URLs in DB
// Run: node scripts/update-badges.mjs

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TOURNAMENT_ID = 'cmsm4d7pj00012r3qqtqi6mxn';

// Badge URLs — Wikimedia Commons / Wikipedia uploads (120px thumbnails)
// Sorted by code for easy lookup
const BADGES = {
  AEK:   'https://upload.wikimedia.org/wikipedia/en/thumb/0/04/AEK_Athens_FC_logo.svg/120px-AEK_Athens_FC_logo.svg.png',
  ARS:   'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/120px-Arsenal_FC.svg.png',
  AVL:   'https://upload.wikimedia.org/wikipedia/en/thumb/9/9a/Aston_Villa_FC_new_crest.svg/120px-Aston_Villa_FC_new_crest.svg.png',
  ATL:   'https://upload.wikimedia.org/wikipedia/en/thumb/f/f9/Atletico_Madrid_Logo_2024.svg/120px-Atletico_Madrid_Logo_2024.svg.png',
  BAR:   'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/120px-FC_Barcelona_%28crest%29.svg.png',
  BAY:   'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg/120px-FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg.png',
  BOD:   'https://upload.wikimedia.org/wikipedia/en/thumb/8/8d/FK_Bodo_Glimt_logo.svg/120px-FK_Bodo_Glimt_logo.svg.png',
  BRU:   'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Club_brugge.png/120px-Club_brugge.png',
  BET:   'https://upload.wikimedia.org/wikipedia/en/thumb/2/2f/Real_Betis_2022_logo.svg/120px-Real_Betis_2022_logo.svg.png',
  BVB:   'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/120px-Borussia_Dortmund_logo.svg.png',
  COM:   'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Calcio_Como_-_logo_%28Italy%2C_2019-%29.svg/120px-Calcio_Como_-_logo_%28Italy%2C_2019-%29.svg.png',
  FEN:   'https://upload.wikimedia.org/wikipedia/en/thumb/3/39/Fenerbah%C3%A7e.svg/120px-Fenerbah%C3%A7e.svg.png',
  FPI:   'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Feyenoord_logo_since_2024.svg/120px-Feyenoord_logo_since_2024.svg.png',
  GAL:   'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Galatasaray_NEW_LOGOO.png/120px-Galatasaray_NEW_LOGOO.png',
  INT:   'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/FC_Internazionale_Milano_2021.svg/120px-FC_Internazionale_Milano_2021.svg.png',
  LASK:  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/LASK-Logo_2023.svg/120px-LASK-Logo_2023.svg.png',
  LEN:   'https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/RC_Lens_logo.svg/120px-RC_Lens_logo.svg.png',
  LIL:   'https://upload.wikimedia.org/wikipedia/en/thumb/3/3f/Lille_OSC_2018_logo.svg/120px-Lille_OSC_2018_logo.svg.png',
  LIV:   'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/120px-Liverpool_FC.svg.png',
  MCI:   'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/120px-Manchester_City_FC_badge.svg.png',
  MUN:   'https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/120px-Manchester_United_FC_crest.svg.png',
  NAP:   'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/SSC_Napoli_2025_%28white_and_azure%29.svg/120px-SSC_Napoli_2025_%28white_and_azure%29.svg.png',
  PSG:   'https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Paris_Saint-Germain_F.C..svg/120px-Paris_Saint-Germain_F.C..svg.png',
  POR:   'https://upload.wikimedia.org/wikipedia/en/thumb/f/f1/FC_Porto.svg/120px-FC_Porto.svg.png',
  PSV:   'https://upload.wikimedia.org/wikipedia/en/thumb/0/05/PSV_Eindhoven.svg/120px-PSV_Eindhoven.svg.png',
  RBL:   'https://upload.wikimedia.org/wikipedia/en/thumb/0/04/RB_Leipzig_2014_logo.svg/120px-RB_Leipzig_2014_logo.svg.png',
  RMA:   'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/120px-Real_Madrid_CF.svg.png',
  ROM:   'https://upload.wikimedia.org/wikipedia/en/thumb/f/f7/AS_Roma_logo_%282017%29.svg/120px-AS_Roma_logo_%282017%29.svg.png',
  SAB:   'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/Sabah_FC_%28Azerbaijan%29.png/120px-Sabah_FC_%28Azerbaijan%29.png',
  SHK:   'https://upload.wikimedia.org/wikipedia/en/thumb/a/a1/FC_Shakhtar_Donetsk.svg/120px-FC_Shakhtar_Donetsk.svg.png',
  SLO:   'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/SK_Slovan_Bratislava_logo.svg/120px-SK_Slovan_Bratislava_logo.svg.png',
  SLP:   'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/SK_Slavia_Praha_full_logo.svg/120px-SK_Slavia_Praha_full_logo.svg.png',
  SP:    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sporting_Clube_de_Portugal_2026.svg/120px-Sporting_Clube_de_Portugal_2026.svg.png',
  STU:   'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/VfB_Stuttgart_1893_Logo.svg/120px-VfB_Stuttgart_1893_Logo.svg.png',
  VIK:   'https://upload.wikimedia.org/wikipedia/en/thumb/1/13/Viking_FK_logo_2020.svg/120px-Viking_FK_logo_2020.svg.png',
  VIL:   'https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/Villarreal_CF_logo-en.svg/120px-Villarreal_CF_logo-en.svg.png',
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
