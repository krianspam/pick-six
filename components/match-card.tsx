"use client";
import { useEffect, useState } from "react";
import { Check, Clock3, LockKeyhole, MapPin, Heart } from "lucide-react";
import type { Match, Prediction, Member } from "@/lib/types";
import { formatTimeUntil, getPredictionWindow } from "@/lib/prediction-window";
import { formatKickoffToIST } from "@/lib/time";
import { AvatarStack } from "./avatar-stack";

export function MatchCard({ match, saved, onSave, members = [], isMyTeam = false }: { match: Match; saved?: Prediction; onSave: (p: Prediction) => void; members?: Member[]; isMyTeam?: boolean }) {
  const [isEditing, setIsEditing] = useState(!saved);
  const [home, setHome] = useState(saved?.home?.toString() ?? "");
  const [away, setAway] = useState(saved?.away?.toString() ?? "");
  const [penaltyWinnerId, setPenaltyWinnerId] = useState<string | null>(saved?.penaltyWinnerId ?? null);
  const [sameForAll, setSameForAll] = useState(false);
  const [flash, setFlash] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const date = new Date(match.kickoff);
  const windowState = getPredictionWindow(date, now);
  
  const isKnockout = match.stage !== "GROUP";
  const isTie = home !== "" && away !== "" && home === away;
  const needsPenaltyWinner = isKnockout && isTie;
  
  const submit = () => {
    if (!windowState.isOpen) return;
    if (!isMyTeam) return; // Can't predict matches not involving your team
    if (!isEditing) {
      setIsEditing(true);
      return;
    }
    if (home === "" || away === "") return;
    if (needsPenaltyWinner && !penaltyWinnerId) return; // Prevent saving if they haven't picked a winner
    onSave({ matchId: match.id, home: +home, away: +away, penaltyWinnerId: needsPenaltyWinner ? penaltyWinnerId : null, sameForAll });
    setFlash(true);
    setIsEditing(false);
    setTimeout(() => setFlash(false), 1500);
  };

  // Disable when: window closed OR match is not involving user's team
  const isDisabledByTeam = !!match.id && !isMyTeam;

  // Find members who have predicted this match
  const predictedMembers = members.filter(m => match.predictions?.some(p => p.userId === m.id));

  return <article className={`relative min-w-[310px] snap-start rounded-[24px] border bg-white p-5 shadow-sm transition sm:min-w-[350px] ${isMyTeam ? "border-lime shadow-card ring-1 ring-lime/40 hover:-translate-y-1" : "border-ink/10 opacity-60"}`}>
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <span className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.13em] ${windowState.isOpen ? "bg-lime text-forest" : "bg-forest/7 text-forest"}`}>{windowState.isOpen ? "Predictions open" : match.stage === "GROUP" ? match.group : match.stage.replace(/_/g, ' ')}</span>
        {isMyTeam && <span className="inline-flex items-center gap-1 rounded-full bg-forest px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-lime"><Heart size={10} className="fill-lime"/> Your team</span>}
      </div>
      <span className="flex items-center gap-1.5 text-[11px] font-bold text-ink/45"><Clock3 size={13}/>{mounted ? formatKickoffToIST(date) : ""}</span>
    </div>
    <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3"><Team flag={match.home.flag} name={match.home.name}/><div className="flex flex-col items-center gap-2"><div className="flex items-center gap-2"><Score value={home} set={setHome} label={`${match.home.name} score`} disabled={!windowState.isOpen || !isEditing || !isMyTeam}/><span className="font-display text-lg font-bold text-ink/25">:</span><Score value={away} set={setAway} label={`${match.away.name} score`} disabled={!windowState.isOpen || !isEditing || !isMyTeam}/></div></div><Team flag={match.away.flag} name={match.away.name} right/></div>
    
    {needsPenaltyWinner && (
      <div className="mt-4 rounded-xl border border-coral/20 bg-coral/5 p-3 text-center animate-in fade-in slide-in-from-top-2">
        <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.1em] text-coral">Knockout Tie: Who advances on penalties?</p>
        <div className="flex overflow-hidden rounded-lg border border-ink/10">
          <button onClick={() => windowState.isOpen && isEditing && setPenaltyWinnerId(match.home.code)} disabled={!windowState.isOpen || !isEditing} className={`flex-1 px-3 py-2 text-xs font-bold transition ${penaltyWinnerId === match.home.code ? "bg-coral text-white" : "bg-white text-ink/70 hover:bg-cream"} disabled:opacity-50`}>{match.home.name}</button>
          <div className="w-px bg-ink/10" />
          <button onClick={() => windowState.isOpen && isEditing && setPenaltyWinnerId(match.away.code)} disabled={!windowState.isOpen || !isEditing} className={`flex-1 px-3 py-2 text-xs font-bold transition ${penaltyWinnerId === match.away.code ? "bg-coral text-white" : "bg-white text-ink/70 hover:bg-cream"} disabled:opacity-50`}>{match.away.name}</button>
        </div>
      </div>
    )}

    <div className="mt-4 flex flex-col gap-3">
      {predictedMembers.length > 0 && (
        <div className="flex items-center gap-2">
          <AvatarStack members={predictedMembers} max={3} />
          <span className="text-[10px] font-bold text-ink/40 uppercase tracking-[.05em]">{predictedMembers.length} {predictedMembers.length === 1 ? "pick" : "picks"} made</span>
        </div>
      )}
      <div className="flex items-center gap-3 text-sm text-ink/60">
        <label className={`inline-flex items-center gap-2 rounded-full border border-ink/10 bg-cream px-3 py-2 ${(!windowState.isOpen || !isEditing || !isMyTeam) ? 'opacity-50 pointer-events-none' : ''}`}>
          <input type="checkbox" checked={sameForAll} disabled={!windowState.isOpen || !isEditing || !isMyTeam} onChange={(event) => setSameForAll(event.target.checked)} className="h-4 w-4 rounded border-ink/20 text-forest focus:ring-forest/60" />
          <span>Apply this pick to all leagues</span>
        </label>
        <span className="text-xs uppercase tracking-[.16em] leading-tight flex-1">{!isMyTeam ? "Only your team's matches" : windowState.isOpen ? "Same pick will save across leagues" : windowState.state === "scheduled" ? "Locked until 24h before kickoff" : "Predictions are locked"}</span>
      </div>
    </div>
    <div className="mt-6 flex items-center justify-between border-t border-ink/8 pt-4">
      <span className="flex min-w-0 items-center gap-1.5 truncate pr-2 text-[10px] font-semibold text-ink/40">
        <MapPin size={12}/>{match.venue.split(" · ")[0]}
      </span>
      <button
        onClick={submit}
        disabled={!windowState.isOpen || !isMyTeam || (isEditing && (home === "" || away === "" || (needsPenaltyWinner && !penaltyWinnerId)))}
        className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[11px] font-extrabold transition ${flash ? "bg-lime text-forest" : !isMyTeam ? "bg-ink/7 text-ink/45" : windowState.isOpen ? (isEditing ? "bg-ink text-white hover:bg-forest" : "bg-cream text-ink hover:bg-ink/10") : "bg-ink/7 text-ink/45"} disabled:cursor-not-allowed`}
      >
        {flash ? <Check size={14}/> : !windowState.isOpen ? <LockKeyhole size={14}/> : null}
        {flash ? "Locked in" : !isMyTeam ? "Not your team" : !windowState.isOpen ? (windowState.state === "scheduled" ? `Opens in ${formatTimeUntil(windowState.opensAt, now)}` : "Predictions closed") : isEditing ? (saved ? "Update pick" : "Save pick") : "Edit pick"}
      </button>
    </div>
  </article>;
}
function Team({ flag, name, right }: { flag: string; name: string; right?: boolean }) {
  const isUrl = typeof flag === "string" && flag.includes("://");
  return (
    <div className={`min-w-0 ${right ? "text-right" : ""}`}>
      {isUrl
        ? <img src={flag} alt={name} className="h-12 w-12 object-contain mx-auto" />
        : <span className="text-4xl drop-shadow-sm">{flag || "🏳️"}</span>
      }
      <p className="mt-2 truncate text-xs font-extrabold">{name}</p>
    </div>
  );
}
function Score({ value, set, label, disabled }: { value: string; set: (v: string) => void; label: string; disabled: boolean }) { return <input aria-label={label} disabled={disabled} className="score-input h-12 w-11 rounded-xl border border-ink/15 bg-cream text-center font-display text-xl font-bold outline-none transition focus:border-forest focus:ring-4 focus:ring-forest/10 disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-ink/40" type="number" min="0" max="20" inputMode="numeric" value={value} onChange={e => set(e.target.value.slice(0, 2))} placeholder="–"/> }
