import { Trophy, Target, CalendarDays, Users, Lock, ChevronRight, X, Settings, Shield } from "lucide-react";
import type { League, Match, Prediction } from "@/lib/types";
import { formatTimeUntil, getPredictionWindow } from "@/lib/prediction-window";

export function PredictionsView({ league, dbMatches, currentUserId }: { league: League | null; dbMatches: any[]; currentUserId?: string }) {
  if (!league) return null;
  
  const pastMatches = dbMatches.filter(m => m.status !== "upcoming").sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime());

  if (pastMatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-ink/10 bg-white p-12 text-center shadow-sm">
        <Target size={48} className="mb-4 text-ink/20" />
        <h2 className="font-display text-2xl font-bold">No past predictions yet</h2>
        <p className="mt-2 text-sm text-ink/60 max-w-md">Once matches finish, your league's predictions will appear here along with the points earned.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl font-bold">Past Matches</h2>
      </div>
      
      <div className="space-y-4">
        {pastMatches.map((match) => {
          const userPicks = match.predictions || [];
          
          return (
            <div key={match.id} className="flex flex-col rounded-2xl border border-ink/10 bg-white shadow-sm overflow-hidden">
              {/* Match Header */}
              <div className="bg-cream p-4 border-b border-ink/10 flex items-center justify-between sm:px-6">
                <div className="flex items-center gap-4 w-full">
                  <div className="flex flex-col items-center flex-1 sm:flex-none">
                    {match.home.flag.startsWith('http')
                      ? <img src={match.home.flag} alt={match.home.name} className="h-10 w-10 object-contain mx-auto" />
                      : <span className="text-2xl">{match.home.flag}</span>
                    }
                    <span className="text-[10px] font-extrabold uppercase mt-1">{match.home.code}</span>
                  </div>
                  <div className="flex-1 text-center flex flex-col items-center justify-center">
                    <div className="font-display text-2xl font-bold">{match.homeScore ?? "-"} <span className="text-ink/30 mx-2">—</span> {match.awayScore ?? "-"}</div>
                    <div className="text-[9px] font-extrabold tracking-widest text-ink/40 uppercase mt-1">Final Score</div>
                  </div>
                  <div className="flex flex-col items-center flex-1 sm:flex-none">
                    {match.away.flag.startsWith('http')
                      ? <img src={match.away.flag} alt={match.away.name} className="h-10 w-10 object-contain mx-auto" />
                      : <span className="text-2xl">{match.away.flag}</span>
                    }
                    <span className="text-[10px] font-extrabold uppercase mt-1">{match.away.code}</span>
                  </div>
                </div>
              </div>
              
              {/* Predictions List */}
              <div className="p-2 sm:p-4 divide-y divide-ink/5">
                {league.members.map((member) => {
                  const p = userPicks.find((pick: any) => pick.userId === member.id);
                  let label = "Missed";
                  let color = "bg-ink/5 text-ink/40";
                  
                  if (p) {
                    if (p.reason === "exact") {
                      label = "Exact +3"; color = "bg-lime text-forest";
                    } else if (p.reason === "goal_difference") {
                      label = "GD +2"; color = "bg-forest/10 text-forest";
                    } else if (p.reason === "closest" || p.reason === "walkover") {
                      label = "Closest +1"; color = "bg-coral/10 text-coral";
                    } else {
                      label = "Wrong 0"; color = "bg-coral/10 text-coral";
                    }
                  }
                  
                  return (
                    <div key={member.id} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${member.id === currentUserId ? 'bg-lime/10' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span style={{ background: member.color }} className="grid h-8 w-8 place-items-center rounded-full text-[10px] font-extrabold">{member.initials}</span>
                        <span className="text-sm font-bold">{member.name}{member.id === currentUserId && " (You)"}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-display text-lg font-bold text-ink/80">{p ? `${p.home} - ${p.away}` : "—"}</span>
                        <div className={`rounded-xl px-3 py-1.5 text-[10px] font-extrabold w-20 text-center ${color}`}>
                          {label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LeaderboardView({ league, currentUserId, onRemove }: { league: League | null; currentUserId?: string; onRemove?: (userId: string) => void }) {
  if (!league) return null;

  const isOwner = currentUserId === league.ownerId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl font-bold">Leaderboard</h2>
      </div>
      
      <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/5 text-ink/40">
              <th className="pb-3 font-bold uppercase tracking-wider">Rank</th>
              <th className="pb-3 font-bold uppercase tracking-wider">Player</th>
              <th className="pb-3 text-center font-bold uppercase tracking-wider">Exact</th>
              <th className="pb-3 text-right font-bold uppercase tracking-wider">Points</th>
              {isOwner && <th className="pb-3 w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {league.members.map((m, i) => (
              <tr key={m.id} className="group transition-colors hover:bg-ink/[0.02]">
                <td className="py-4 font-display text-lg font-bold text-ink/40 w-16">{i + 1}</td>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <span style={{ background: m.color }} className="grid h-8 w-8 place-items-center rounded-full text-[9px] font-extrabold">{m.initials}</span>
                    <span className="font-bold">{m.name}</span>
                  </div>
                </td>
                <td className="py-4 text-center font-bold text-ink/50">{m.exact || 0}</td>
                <td className="py-4 text-right font-display text-xl font-bold text-forest">{m.points}</td>
                {isOwner && (
                  <td className="py-4 text-right">
                    {m.id !== league.ownerId && (
                      <button 
                        onClick={() => onRemove?.(m.id)}
                        className="p-1.5 text-ink/30 hover:text-coral hover:bg-coral/10 rounded-lg transition"
                        title="Remove player"
                      >
                        <X size={16} strokeWidth={3} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TeamsView({ teams = [], tournamentName = "" }: { teams?: any[]; tournamentName?: string }) {
  if (!teams.length) {
    return <div className="rounded-3xl border border-ink/10 bg-white p-10 text-center"><p className="font-display text-xl font-bold">No teams loaded yet.</p></div>;
  }
  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl font-bold">Champions League — League Phase</h2>
      <p className="text-xs font-extrabold uppercase tracking-widest text-ink/40">36 teams · 8 matches each · Top 8 direct to R16</p>
      <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-cream text-[10px] font-extrabold uppercase tracking-widest text-ink/40">
            <tr>
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Team</th>
              <th className="text-center px-3 py-3">Pld</th>
              <th className="text-center px-3 py-3">W</th>
              <th className="text-center px-3 py-3">D</th>
              <th className="text-center px-3 py-3">L</th>
              <th className="text-center px-3 py-3">GF</th>
              <th className="text-center px-3 py-3">GA</th>
              <th className="text-center px-3 py-3">GD</th>
              <th className="text-center px-3 py-3 font-display text-base">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {teams.map((t: any, i: number) => (
              <tr key={t.id} className="hover:bg-ink/[0.02] transition-colors">
                <td className="px-4 py-3 font-display text-lg font-bold text-ink/30">{i + 1}</td>
                <td className="px-4 py-3 font-bold"><img src={t.flagUrl} alt={t.name} className="h-6 w-6 inline-block align-middle mr-2" />{t.name}<span className="ml-2 text-[10px] font-extrabold text-ink/30">{t.code}</span></td>
                <td className="px-3 py-3 text-center text-ink/60">0</td>
                <td className="px-3 py-3 text-center text-ink/60">0</td>
                <td className="px-3 py-3 text-center text-ink/60">0</td>
                <td className="px-3 py-3 text-center text-ink/60">0</td>
                <td className="px-3 py-3 text-center text-ink/60">0</td>
                <td className="px-3 py-3 text-center text-ink/60">0</td>
                <td className="px-3 py-3 text-center text-ink/60 font-bold">0</td>
                <td className="px-3 py-3 text-center font-display text-xl font-bold text-forest">0</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TournamentView({ matches = [] }: { matches?: any[] }) {
  if (!matches.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-ink/10 bg-white p-12 text-center shadow-sm">
        <Trophy size={48} className="mb-4 text-ink/20" />
        <h2 className="font-display text-2xl font-bold">Fixtures coming soon</h2>
        <p className="mt-2 text-sm text-ink/60 max-w-md">
          The draw has not been made yet. Once UEFA announces the matchups, fixtures will appear here automatically.
        </p>
        <p className="mt-4 text-xs font-extrabold uppercase tracking-widest text-ink/30">
          Check back after the draw — typically late August
        </p>
      </div>
    );
  }
  // TODO: render bracket / fixtures grid once matches exist
  return <TeamsView teams={[]} />;
}


export function SettingsView({ user, league }: { user: any, league?: any }) {
  const isOwner = user?.id && league?.ownerId && user.id === league.ownerId;
  const isMember = user?.id && league?.members?.some((m: any) => m.id === user.id);

  const deleteLeague = async () => {
    if (!league) return;
    if (confirm("Are you sure you want to permanently delete this league? This action cannot be undone.")) {
      try {
        const res = await fetch(`/api/leagues/${league.code}`, { method: "DELETE" });
        if (res.ok) {
          window.location.reload();
        } else {
          alert("Failed to delete league");
        }
      } catch (err) {
        alert("An error occurred");
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col rounded-3xl border border-ink/10 bg-white p-8 shadow-sm">
        <h2 className="font-display text-2xl font-bold">Settings</h2>
        <p className="mt-2 text-sm text-ink/60 max-w-md">Settings UI coming soon.</p>
      </div>

      {isOwner ? (
        <div className="flex flex-col items-start rounded-3xl border border-coral/20 bg-coral/5 p-8 shadow-sm">
          <h2 className="font-display text-xl font-bold text-coral">Danger Zone</h2>
          <p className="mb-6 mt-2 text-sm text-coral/70 max-w-md">You are the owner. You can leave the league (which transfers ownership to the oldest member), or permanently delete the league for everyone.</p>
          <div className="flex items-center gap-3">
            <button onClick={async () => {
              if (confirm("Are you sure you want to leave this league? Ownership will be transferred to the earliest joined member.")) {
                try {
                  const res = await fetch(`/api/leagues/${league.code}/members/${user.id}`, { method: "DELETE" });
                  if (res.ok) window.location.reload();
                  else alert("Failed to leave league");
                } catch (err) {
                  alert("An error occurred");
                }
              }
            }} className="rounded-xl border border-coral text-coral px-4 py-2 font-bold transition hover:bg-coral/10">
              Leave League
            </button>
            <button onClick={deleteLeague} className="rounded-xl bg-coral px-4 py-2 font-bold text-white transition hover:bg-coral/90">
              Delete League
            </button>
          </div>
        </div>
      ) : isMember ? (
        <div className="flex flex-col items-start rounded-3xl border border-coral/20 bg-coral/5 p-8 shadow-sm">
          <h2 className="font-display text-xl font-bold text-coral">Leave League</h2>
          <p className="mb-6 mt-2 text-sm text-coral/70 max-w-md">Leave this league. Your predictions will remain in the database but you will no longer have access to the leaderboard.</p>
          <button onClick={async () => {
            if (confirm("Are you sure you want to leave this league?")) {
              try {
                const res = await fetch(`/api/leagues/${league.code}/members/${user.id}`, { method: "DELETE" });
                if (res.ok) window.location.reload();
                else alert("Failed to leave league");
              } catch (err) {
                alert("An error occurred");
              }
            }
          }} className="rounded-xl bg-coral px-4 py-2 font-bold text-white transition hover:bg-coral/90">
            Leave League
          </button>
        </div>
      ) : null}
    </div>
  );
}
