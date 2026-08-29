// Fetch badge URLs for all 36 CL 2026/27 teams via Wikipedia API
// Run: node scripts/fetch-badges.mjs

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';

const teams = [
  { code: 'PSG', name: 'Paris Saint-Germain', wiki: 'Paris_Saint-Germain_F.C.' },
  { code: 'BAY', name: 'Bayern Munich', wiki: 'FC_Bayern_Munich' },
  { code: 'RMA', name: 'Real Madrid', wiki: 'Real_Madrid_CF' },
  { code: 'LIV', name: 'Liverpool', wiki: 'Liverpool_F.C.' },
  { code: 'INT', name: 'Inter Milan', wiki: 'Inter_Milan' },
  { code: 'MCI', name: 'Manchester City', wiki: 'Manchester_City_F.C.' },
  { code: 'ARS', name: 'Arsenal', wiki: 'Arsenal_F.C.' },
  { code: 'BAR', name: 'Barcelona', wiki: 'FC_Barcelona' },
  { code: 'ATL', name: 'Atlético Madrid', wiki: 'Atl%C3%A9tico_Madrid' },
  { code: 'BVB', name: 'Borussia Dortmund', wiki: 'Borussia_Dortmund' },
  { code: 'ROM', name: 'Roma', wiki: 'AS_Roma' },
  { code: 'SP', name: 'Sporting CP', wiki: 'Sporting_CP' },
  { code: 'POR', name: 'Porto', wiki: 'FC_Porto' },
  { code: 'MUN', name: 'Manchester United', wiki: 'Manchester_United_F.C.' },
  { code: 'BRU', name: 'Club Brugge', wiki: 'Club_Brugge_KV' },
  { code: 'BET', name: 'Real Betis', wiki: 'Real_Betis' },
  { code: 'PSV', name: 'PSV Eindhoven', wiki: 'PSV_Eindhoven' },
  { code: 'AVL', name: 'Aston Villa', wiki: 'Aston_Villa_F.C.' },
  { code: 'FPI', name: 'Feyenoord', wiki: 'Feyenoord' },
  { code: 'LIL', name: 'Lille', wiki: 'LOSC_Lille' },
  { code: 'BOD', name: 'Bodø/Glimt', wiki: 'Bod%C3%B8/Glimt' },
  { code: 'NAP', name: 'Napoli', wiki: 'SSC_Napoli' },
  { code: 'RBL', name: 'RB Leipzig', wiki: 'RB_Leipzig' },
  { code: 'VIL', name: 'Villarreal', wiki: 'Villarreal_CF' },
  { code: 'FEN', name: 'Fenerbahçe', wiki: 'Fenerbah%C3%A7e_S.K.' },
  { code: 'SHK', name: 'Shakhtar Donetsk', wiki: 'FC_Shakhtar_Donetsk' },
  { code: 'GAL', name: 'Galatasaray', wiki: 'Galatasaray_S.K.' },
  { code: 'SLP', name: 'Slavia Prague', wiki: 'SK_Slavia_Prague' },
  { code: 'SLO', name: 'Slovan Bratislava', wiki: '%C5%A0K_Slovan_Bratislava' },
  { code: 'STU', name: 'Stuttgart', wiki: 'VfB_Stuttgart' },
  { code: 'AEK', name: 'AEK Athens', wiki: 'AEK_Athens_F.C.' },
  { code: 'LASK', name: 'LASK', wiki: 'LASK_Linz' },
  { code: 'COM', name: 'Como', wiki: 'Como_1907' },
  { code: 'LEN', name: 'Lens', wiki: 'RC_Lens' },
  { code: 'VIK', name: 'Viking', wiki: 'Viking_FK' },
  { code: 'SAB', name: 'Sabah', wiki: 'Sabah_FK_(Azerbaijan)' },
];

async function fetchBadge(team) {
  const url = `${WIKIPEDIA_API}?action=query&titles=${encodeURIComponent(team.wiki)}&prop=pageimages&format=json&pithumbsize=120&origin=*`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return { code: team.code, name: team.name, badgeUrl: null, error: 'no pages' };
    const page = Object.values(pages)[0];
    if (page?.thumbnail?.source) {
      return { code: team.code, name: team.name, badgeUrl: page.thumbnail.source };
    }
    return { code: team.code, name: team.name, badgeUrl: null, error: 'no thumbnail' };
  } catch (e) {
    return { code: team.code, name: team.name, badgeUrl: null, error: String(e) };
  }
}

async function main() {
  const results = [];
  for (const team of teams) {
    process.stdout.write(`Fetching ${team.name}... `);
    const result = await fetchBadge(team);
    if (result.badgeUrl) {
      console.log(`✓ ${result.badgeUrl.slice(0, 60)}...`);
    } else {
      console.log(`✗ ${result.error}`);
    }
    results.push(result);
    await new Promise(r => setTimeout(r, 100)); // be nice to Wikipedia
  }

  console.log('\n=== RESULTS ===');
  for (const r of results) {
    if (r.badgeUrl) {
      console.log(`  '${r.code}': '${r.badgeUrl}',`);
    } else {
      console.log(`  MISSING: ${r.code} (${r.name}) - ${r.error}`);
    }
  }
}

main();
