import type { League, Match } from "./types";

const t = (code: string, name: string, flag: string): { code: string; name: string; flag: string; short: string } => ({ code, name, flag, short: code });
export const matches: Match[] = []; // Matches will be added once the draw is finalised

export const demoLeague: League = {
  id: "league-1", name: "Champions XI", code: "CHAMPS26", ownerId: "u1", createdAt: "2026-09-10",
  tournament: { name: "Champions League 2026/27" } as any,
  members: [
    { id: "u1", name: "You", initials: "YP", color: "#d9ff57", points: 17, exact: 3, gd: 3, close: 2 },
    { id: "u2", name: "Maya", initials: "MK", color: "#ff8f79", points: 15, exact: 3, gd: 2, close: 2 },
    { id: "u3", name: "Jonah", initials: "JR", color: "#9fbcff", points: 12, exact: 2, gd: 2, close: 2 },
    { id: "u4", name: "Priya", initials: "PS", color: "#f6c85f", points: 10, exact: 2, gd: 1, close: 2 },
    { id: "u5", name: "Theo", initials: "TB", color: "#c7a7ff", points: 8, exact: 1, gd: 2, close: 1 },
  ]
};

// Champions League 2025/26 teams (demo/demo-only — real data comes from DB via API)
export const CL_TEAMS = [
  { code: "RMA", name: "Real Madrid", flag: "🇪🇸" },
  { code: "MCI", name: "Manchester City", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "BAY", name: "Bayern Munich", flag: "🇩🇪" },
  { code: "BAR", name: "Barcelona", flag: "🇪🇸" },
  { code: "ARS", name: "Arsenal", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "PSG", name: "Paris Saint-Germain", flag: "🇫🇷" },
  { code: "JUV", name: "Juventus", flag: "🇮🇹" },
  { code: "INT", name: "Inter Milan", flag: "🇮🇹" },
  { code: "LIV", name: "Liverpool", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "CHE", name: "Chelsea", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "BVB", name: "Borussia Dortmund", flag: "🇩🇪" },
  { code: "ATL", name: "Atletico Madrid", flag: "🇪🇸" },
  { code: "BEN", name: "Benfica", flag: "🇵🇹" },
  { code: "PSV", name: "PSV Eindhoven", flag: "🇳🇱" },
  { code: "ASM", name: "Monaco", flag: "🇫🇷" },
  { code: "FPI", name: "Feyenoord", flag: "🇳🇱" },
  { code: "SP", name: "Sporting CP", flag: "🇵🇹" },
  { code: "TOT", name: "Tottenham", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
];
