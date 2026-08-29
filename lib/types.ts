export type Team = { code: string; name: string; flag: string; short: string };
export type MatchPrediction = { userId: string; home: number; away: number; points?: number; reason?: string };
export type Match = {
  id: string; stage: string; group?: string; home: Team; away: Team;
  kickoff: string; venue: string; status: "upcoming" | "live" | "finished";
  homeScore?: number; awayScore?: number;
  predictions?: MatchPrediction[];
};
export type Prediction = { matchId: string; home: number; away: number; leagueId?: string; sameForAll?: boolean; penaltyWinnerId?: string | null; };
export type Member = { id: string; name: string; initials: string; color: string; points: number; exact: number; gd: number; close: number };
export type League = { id: string; name: string; code: string; ownerId: string; members: Member[]; createdAt: string; tournament?: { name: string } };
