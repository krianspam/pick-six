const dateFrom = new Date().toISOString().split('T')[0];
const dateTo = '2027-05-30';
const apiKey = process.env.FOOTBALL_DATA_API_KEY || "abeb5b76efe04af4875f663a91c057dd";
fetch(`https://api.football-data.org/v4/competitions/2001/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`, {
  headers: { "X-Auth-Token": apiKey }
}).then(res => res.json()).then(data => {
  if (data.matches) {
    console.log(data.matches.map(m => ({ stage: m.stage, group: m.group, home: m.homeTeam?.tla, away: m.awayTeam?.tla })));
  } else {
    console.log(data);
  }
}).catch(console.error);
