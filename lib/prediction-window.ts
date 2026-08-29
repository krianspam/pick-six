export const PREDICTION_WINDOW_MS = 24 * 60 * 60 * 1000;

export type PredictionWindowState = "scheduled" | "open" | "closed";

export function getPredictionWindow(kickoff: string | Date, now = new Date()) {
  const kickoffAt = kickoff instanceof Date ? kickoff : new Date(kickoff);
  const opensAt = new Date(kickoffAt.getTime() - PREDICTION_WINDOW_MS);
  const state: PredictionWindowState =
    now < opensAt ? "scheduled" : now < kickoffAt ? "open" : "closed";
  return { state, opensAt, kickoffAt, isOpen: state === "open" };
}

export function formatTimeUntil(target: Date, now = new Date()) {
  const minutes = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
