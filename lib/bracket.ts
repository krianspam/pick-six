export type GroupTeam = { teamId: string; points: number; goalsFor: number; goalsAgainst: number; wins: number };
export const rankGroup = (teams: GroupTeam[]) => [...teams].sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor || b.wins - a.wins);
export const nextRoundSlot = (stage: string, slot: number) => {
  if (stage === "ROUND_OF_16") return { stage: "QUARTER_FINAL", slot: Math.ceil(slot / 2), side: slot % 2 ? "home" : "away" };
  if (stage === "QUARTER_FINAL") return { stage: "SEMI_FINAL", slot: Math.ceil(slot / 2), side: slot % 2 ? "home" : "away" };
  if (stage === "SEMI_FINAL") return { stage: "FINAL", slot: 1, side: slot === 1 ? "home" : "away" };
  return null;
};
