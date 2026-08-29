export type Pick = { userId: string; home: number; away: number; penaltyWinnerId?: string | null };
export type Award = { userId: string; points: number; reason: string };

/**
 * Points-for-all league scoring.
 * Every player who qualifies at a given tier earns that tier's points.
 * Tiers (checked in order, only highest reached tier applies):
 *  1. Exact score       → 3 pts  (everyone who predicted the precise scoreline)
 *  2. Exact GD          → 2 pts  (everyone who predicted the correct goal difference)
 *  3. Closest GD        → 1 pt   (everyone tied for closest margin — could be many)
 * Special: solo prediction → 1 pt walkover.
 * Bonus: +1 point if they correctly guessed the penalty shootout winner for a tied knockout match.
 */
export function scoreLeague(actualHome: number, actualAway: number, picks: Pick[], actualHomePenaltyScore?: number | null, actualAwayPenaltyScore?: number | null, homeTeamId?: string, awayTeamId?: string): Award[] {
  if (picks.length === 0) return [];

  // Determine if there was a shootout and who won
  let actualPenaltyWinnerId = null;
  if (actualHomePenaltyScore != null && actualAwayPenaltyScore != null) {
    if (actualHomePenaltyScore > actualAwayPenaltyScore) {
      actualPenaltyWinnerId = homeTeamId;
    } else if (actualAwayPenaltyScore > actualHomePenaltyScore) {
      actualPenaltyWinnerId = awayTeamId;
    }
  }

  // Walkover: only one player predicted this match
  if (picks.length === 1) {
    const p = picks[0];
    let pts = 1;
    let reason = "walkover";
    if (actualPenaltyWinnerId && p.penaltyWinnerId === actualPenaltyWinnerId) {
       pts += 1;
       reason += " + penalty";
    }
    return [{ userId: p.userId, points: pts, reason }];
  }

  const actualDiff = actualHome - actualAway;
  
  // Tier 1: Exact Score
  const exactPicks = picks.filter(p => p.home === actualHome && p.away === actualAway);
  // Tier 2: Exact Goal Difference
  const gdPicks = picks.filter(p => p.home - p.away === actualDiff);
  // Tier 3: Closest Goal Difference
  const diffs = picks.map(p => ({ p, d: Math.abs((p.home - p.away) - actualDiff) }));
  const minD = Math.min(...diffs.map(x => x.d));
  let closestPicks = diffs.filter(x => x.d === minD).map(x => x.p);

  // Tiebreaker for Closest: Priority to those who correctly guessed the match outcome (Win/Loss/Draw)
  const actualOutcome = Math.sign(actualDiff);
  const correctOutcomePicks = closestPicks.filter(p => Math.sign(p.home - p.away) === actualOutcome);
  if (correctOutcomePicks.length > 0) {
    closestPicks = correctOutcomePicks;
  }

  let winners: Pick[] = [];
  let basePoints = 0;
  let baseReason = "";

  if (exactPicks.length > 0) {
    winners = exactPicks;
    basePoints = 3;
    baseReason = "exact";
  } else if (gdPicks.length > 0) {
    winners = gdPicks;
    basePoints = 2;
    baseReason = "goal_difference";
  } else {
    winners = closestPicks;
    basePoints = 1;
    baseReason = "closest";
  }

  const awards: Award[] = winners.map(p => {
    let pts = basePoints;
    let r = baseReason;
    if (actualPenaltyWinnerId && p.penaltyWinnerId === actualPenaltyWinnerId) {
      pts += 1;
      r += " + penalty bonus";
    }
    return { userId: p.userId, points: pts, reason: r };
  });

  return awards;
}

/** @deprecated Legacy head-to-head helper kept for reference only. */
export function scoreHeadToHead(actualHome: number, actualAway: number, a?: Pick, b?: Pick): { userId: string | null; points: 0 | 1 | 2 | 3; reason: string } {
  if (!a && !b) return { userId: null, points: 0, reason: "none" };
  if (!a || !b) return { userId: (a ?? b)!.userId, points: 1, reason: "walkover" };
  const actualDiff = actualHome - actualAway;
  const exact = [a, b].filter(p => p.home === actualHome && p.away === actualAway);
  if (exact.length === 1) return { userId: exact[0].userId, points: 3, reason: "exact" };
  if (exact.length === 2) return { userId: null, points: 0, reason: "tie" };
  const exactGd = [a, b].filter(p => p.home - p.away === actualDiff);
  if (exactGd.length === 1) return { userId: exactGd[0].userId, points: 2, reason: "goal_difference" };
  if (exactGd.length === 2) return { userId: null, points: 0, reason: "tie" };
  const da = Math.abs((a.home - a.away) - actualDiff);
  const db = Math.abs((b.home - b.away) - actualDiff);
  if (da === db) return { userId: null, points: 0, reason: "tie" };
  return { userId: da < db ? a.userId : b.userId, points: 1, reason: "closest" };
}
