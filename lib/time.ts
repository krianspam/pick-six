export function formatKickoffToIST(kickoff: string | Date) {
  const d = kickoff instanceof Date ? kickoff : new Date(kickoff);
  const dateFmt = new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" });
  const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
  return `${dateFmt.format(d)} · ${timeFmt.format(d)} IST`;
}

export function formatKickoffDateIST(kickoff: string | Date) {
  const d = kickoff instanceof Date ? kickoff : new Date(kickoff);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" }).format(d);
}

export function formatKickoffTimeIST(kickoff: string | Date) {
  const d = kickoff instanceof Date ? kickoff : new Date(kickoff);
  const raw = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(d);
  return raw.replace("am", "AM").replace("pm", "PM") + " IST";
}

/**
 * Compact relative-time formatter: "just now", "12m ago", "3h ago", "2d ago".
 * Honest about staleness — once past a day, switches to "Yesterday" / date.
 */
export function formatRelative(iso: string | Date, now: Date = new Date()): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 0) return "in a moment";
  if (diffSec < 45) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
