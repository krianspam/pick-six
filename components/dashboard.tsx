"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, CalendarDays, ChevronDown, ChevronRight, Copy, LayoutDashboard, LogOut, Medal, Menu, Plus, Settings, Shield, ShieldCheck, Sparkles, Target, Trophy, Users, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "./logo";
import { AvatarStack } from "./avatar-stack";
import { CreateLeagueModal } from "./create-league-modal";
import { MatchCard } from "./match-card";
import { demoLeague, matches as fallbackMatches } from "@/lib/data";
import type { League, Prediction } from "@/lib/types";
import { getPredictionWindow } from "@/lib/prediction-window";
import { signOut, useSession } from "next-auth/react";
import { PredictionsView, LeaderboardView, TournamentView, SettingsView, TeamsView } from "./views";
import { PickNextTeamModal } from "./pick-next-team";
import { useClickOutside } from "@/lib/hooks";
import { formatRelative } from "@/lib/time";

export default function Dashboard({ session }: { session?: any }) {
  const [view, setView] = useState("overview");
  const [modal, setModal] = useState(false); 
  const [mobile, setMobile] = useState(false); 
  const [league, setLeague] = useState<League | null>(null); 
  const [allLeagues, setAllLeagues] = useState<any[]>([]);
  const [showLeagueSwitcher, setShowLeagueSwitcher] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [applyToAll, setApplyToAll] = useState(false);
  const [toast, setToast] = useState("");
  const [now, setNow] = useState<Date | null>(null);
  const [lastSyncInfo, setLastSyncInfo] = useState<{ at: string; updated: number; settled: number } | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [tournamentName, setTournamentName] = useState("");
  
  const [dbMatches, setDbMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaguePredictions, setLeaguePredictions] = useState<Record<string, Prediction>>({});

  // Favorite team state
  const [favoriteTeam, setFavoriteTeam] = useState<any>(null);
  const [showPickNextTeam, setShowPickNextTeam] = useState(false);

  const user = session?.user;

  const loadData = async () => {
    if (!user) return;
    try {
      // Load user's favorite team
      const meRes = await fetch("/api/users/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.favoriteTeamId) {
          const teamRes = await fetch(`/api/teams`);
          if (teamRes.ok) {
            const teamData = await teamRes.json();
            const found = teamData.teams?.find((t: any) => t.id === meData.favoriteTeamId);
            if (found) setFavoriteTeam(found);
          }
        } else {
          setFavoriteTeam(null);
        }
      }

      const leaguesRes = await fetch(`/api/leagues?t=${Date.now()}`);
      if (leaguesRes.ok) {
        const leagues = await leaguesRes.json();
        setAllLeagues(leagues);
        if (leagues.length > 0) {
          const lastLeague = localStorage.getItem('lastLeague');
          const preferredLeague = leagues.find((l: any) => l.code === lastLeague) || leagues[0];
          setLeague(preferredLeague);
          await switchLeague(preferredLeague.code);
        }
      }
      
      const notifsRes = await fetch('/api/notifications');
      if (notifsRes.ok) {
        setNotifications(await notifsRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const switchLeague = async (code: string) => {
    setShowLeagueSwitcher(false);
    try {
      console.log("Switching to league:", code);
      localStorage.setItem('lastLeague', code.toUpperCase());
      const encodedCode = encodeURIComponent(code.toUpperCase());
      const leagueRes = await fetch(`/api/leagues/${encodedCode}?t=${Date.now()}`);
      console.log("League fetch response:", leagueRes.status);
      if (leagueRes.ok) {
        const leagueData = await leagueRes.json();
        console.log("League data:", leagueData);
        if (!leagueData.error) {
          setLeague(leagueData);
          if (leagueData.matches) {
            setDbMatches(leagueData.matches);
          }
          if (leagueData.id) {
            const predRes = await fetch(`/api/predictions?leagueId=${encodeURIComponent(leagueData.id)}`);
            if (predRes.ok) {
              const predList = await predRes.json();
              const predMap: Record<string, Prediction> = {};
              if (Array.isArray(predList)) {
                predList.forEach((p: any) => {
                  predMap[p.matchId] = {
                    matchId: p.matchId,
                    home: p.homeScore,
                    away: p.awayScore,
                    leagueId: p.leagueId,
                  };
                });
              }
              setPredictions(predMap);
            }
          }
        } else {
          console.error("League response error:", leagueData.error);
          setToast("Unable to load league. Please try again.");
        }
      } else {
        const errorBody = await leagueRes.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to fetch league:", errorBody);
        setToast("Unable to load league. Please refresh.");
      }
    } catch (e) {
      console.error("Failed to switch league", e);
    }
  };

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    // Fetch sync status once on mount (low-frequency, cached endpoint)
    fetch("/api/sync-status", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.lastSyncAt) {
          setLastSyncInfo({
            at: d.lastSyncAt,
            updated: d.lastUpdate?.updated ?? 0,
            settled: d.lastUpdate?.settled ?? 0,
          });
        }
      })
      .catch(() => {});
      fetch("/api/teams")
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d?.teams) { setTeams(d.teams); setTournamentName(d.tournament?.name ?? ""); } })
        .catch(() => {});
    return () => window.clearInterval(timer);
  }, [user?.id]);

  const save = async (p: Prediction) => {
    if (!user || !league) return;
    const next = { ...predictions, [p.matchId]: { ...p, leagueId: league.id } };
    setPredictions(next);

    try {
      await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: p.matchId,
          homeScore: p.home,
          awayScore: p.away,
          leagueId: league.id,
          sameForAll: p.sameForAll ?? false,
        }),
      });
      const leagueRes = await fetch(`/api/leagues/${league.code.toUpperCase()}`);
      if (leagueRes.ok) {
        const leagueData = await leagueRes.json();
        if (!leagueData.error) {
          setLeague(leagueData);
          if (leagueData.matches) {
            setDbMatches(leagueData.matches);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const created = async (name: string, code: string) => {
    if (!user) return;
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim()
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const leagueRes = await fetch(`/api/leagues/${data.code.toUpperCase()}`);
      if (!leagueRes.ok) throw new Error("Failed to load league");
      const leagueData = await leagueRes.json();
      
      setLeague(leagueData);
      if (leagueData.matches) {
        setDbMatches(leagueData.matches);
      }
    } catch (e: any) {
      alert(e.message || "Failed to create league");
    }
  };

  const copy = async () => {
    if (!league) return;
    const url = `${location.origin}/join/${league.code}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast("Invite link copied");
      setTimeout(() => setToast(""), 1800);
    } catch (err) {
      // Fallback for browsers that block clipboard API
      prompt("Copy your invite link below:", url);
    }
  };

  const removeMember = async (userId: string) => {
    if (!league) return;
    if (!confirm("Are you sure you want to remove this player?")) return;
    try {
      const res = await fetch(`/api/leagues/${league.code}/members/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to remove player");
      }
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-cream flex items-center justify-center font-display text-forest font-bold text-xl">Loading...</div>;
  }

  const activeMatches = dbMatches.length ? dbMatches : (league ? [] : fallbackMatches);
  const upcoming = activeMatches.filter(m => m.status?.toLowerCase() === "upcoming" || m.status?.toLowerCase() === "live");
  const finished = activeMatches.filter(m => m.status?.toLowerCase() === "finished");
  const openMatches = upcoming.filter(m => now && getPredictionWindow(m.kickoff, now).isOpen);
  const savedOpenPicks = openMatches.filter(m => predictions[m.id]).length;
  const completion = openMatches.length ? Math.round((savedOpenPicks / openMatches.length) * 100) : 0;
  
  const displayLeague = league || (allLeagues.length > 0 ? allLeagues[0] : null);

  const groupedLeagues = allLeagues.reduce((acc, l) => {
    const tName = l.tournament?.name || "Tournament";
    if (!acc[tName]) acc[tName] = [];
    acc[tName].push(l);
    return acc;
  }, {} as Record<string, any[]>);

  return <div className="min-h-screen bg-cream text-ink">
    {(showLeagueSwitcher || showNotifications || showProfileMenu) && (
      <div 
        className="fixed inset-0 z-20" 
        onClick={() => {
          setShowLeagueSwitcher(false);
          setShowNotifications(false);
          setShowProfileMenu(false);
        }} 
      />
    )}
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col bg-forest p-5 text-white lg:flex">
      <div className="px-2 py-3"><Logo light/></div>
      <button onClick={() => setModal(true)} className="mt-7 flex items-center justify-center gap-2 rounded-2xl bg-lime px-4 py-3.5 text-xs font-extrabold text-forest transition hover:scale-[1.02]">
        <Plus size={16} strokeWidth={3}/> Start a league
      </button>
      <nav className="mt-8 space-y-1">
        <Nav icon={<LayoutDashboard/>} label="Overview" active={view === "overview"} onClick={() => setView("overview")}/>
        <Nav icon={<Target/>} label="My predictions" badge={upcoming.length} active={view === "predictions"} onClick={() => setView("predictions")}/>
        <Nav icon={<Trophy/>} label="Leaderboard" active={view === "leaderboard"} onClick={() => setView("leaderboard")}/>
        <Nav icon={<Shield/>} label="Teams" active={view === "teams"} onClick={() => setView("teams")}/>
        <Nav icon={<CalendarDays/>} label="Tournament" active={view === "tournament"} onClick={() => setView("tournament")}/>
      </nav>
      <div className="mt-auto border-t border-white/10 pt-5">
        <Nav icon={<Settings/>} label="Settings" active={view === "settings"} onClick={() => setView("settings")}/>
        <button onClick={() => signOut()} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold transition text-white/50 hover:bg-white/5 hover:text-white`}>
          <span className="[&>svg]:h-[17px] [&>svg]:w-[17px]"><LogOut /></span>
          <span className="flex-1">Sign out</span>
        </button>
      </div>
    </aside>
    <AnimatePresence>
      {mobile && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-ink/50 lg:hidden" onClick={() => setMobile(false)}>
        <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} onClick={e => e.stopPropagation()} className="h-full w-[280px] bg-forest p-5 text-white flex flex-col">
          <div className="flex items-center justify-between"><Logo light/><button onClick={() => setMobile(false)}><X/></button></div>
          
          <div className="mt-8 relative z-50">
            <p className="text-[10px] font-extrabold uppercase tracking-[.17em] text-white/50">Your private league</p>
            <button onClick={() => setShowLeagueSwitcher(!showLeagueSwitcher)} className="mt-1 flex items-center gap-2 font-display text-lg font-bold text-white w-full text-left">
              <span className="truncate">{displayLeague?.name || "No league selected"}</span> <ChevronDown size={16} className={showLeagueSwitcher ? "rotate-180 transition-transform shrink-0" : "transition-transform shrink-0"}/>
            </button>
            <AnimatePresence>
              {showLeagueSwitcher && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute left-0 top-full mt-2 w-full rounded-2xl bg-white/10 p-2 shadow-xl backdrop-blur-md border border-white/10">
                  <div className="mb-2 px-2 pt-1 text-[10px] font-extrabold uppercase tracking-wider text-white/40">Switch league</div>
                  <div className="max-h-[40vh] overflow-y-auto overflow-x-hidden">
                    {Object.entries(groupedLeagues).map(([tName, leagues]: any) => (
                      <div key={tName} className="mb-2 last:mb-0">
                        <div className="px-3 py-1 text-[9px] font-extrabold uppercase tracking-wider text-white/30">{tName}</div>
                        {leagues.map((l: any) => (
                          <button key={l.code} onClick={() => { switchLeague(l.code); setMobile(false); }} className={`w-full rounded-xl px-3 py-2 text-left text-sm font-bold transition ${l.code === displayLeague?.code ? "bg-lime text-forest" : "text-white hover:bg-white/10"}`}>
                            {l.name}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setShowLeagueSwitcher(false); setMobile(false); setModal(true); }} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-lime transition hover:bg-white/10">
                    <Plus size={14} strokeWidth={3}/> Join / Create
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <nav className="mt-7 space-y-1">
            <Nav icon={<LayoutDashboard/>} label="Overview" active={view === "overview"} onClick={() => { setView("overview"); setMobile(false); }}/>
            <Nav icon={<Target/>} label="My predictions" badge={upcoming.length} active={view === "predictions"} onClick={() => { setView("predictions"); setMobile(false); }}/>
            <Nav icon={<Trophy/>} label="Leaderboard" active={view === "leaderboard"} onClick={() => { setView("leaderboard"); setMobile(false); }}/>
            <Nav icon={<Shield/>} label="Teams" active={view === "teams"} onClick={() => { setView("teams"); setMobile(false); }}/>
            <Nav icon={<CalendarDays/>} label="Tournament" active={view === "tournament"} onClick={() => { setView("tournament"); setMobile(false); }}/>
          </nav>
          <div className="mt-auto pt-5">
            <Nav icon={<Settings/>} label="Settings" active={view === "settings"} onClick={() => { setView("settings"); setMobile(false); }}/>
            <button onClick={() => signOut()} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold transition text-white/50 hover:bg-white/5 hover:text-white`}>
              <span className="[&>svg]:h-[17px] [&>svg]:w-[17px]"><LogOut /></span>
              <span className="flex-1">Sign out</span>
            </button>
          </div>
        </motion.aside>
      </motion.div>}
    </AnimatePresence>
    <main className="lg:ml-[248px]">
      <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-ink/8 bg-cream/85 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobile(true)} className="grid h-10 w-10 place-items-center rounded-xl bg-white lg:hidden"><Menu size={20}/></button>
          <div className="lg:hidden"><Logo/></div>
          <div className="hidden lg:block relative">
            <p className="text-[10px] font-extrabold uppercase tracking-[.17em] text-ink/35">Your private league</p>
            <button type="button" onClick={() => setShowLeagueSwitcher(!showLeagueSwitcher)} className="mt-1 flex items-center gap-2 font-display text-base font-bold">
              {displayLeague?.name || "No league selected"}<ChevronDown size={14} className={showLeagueSwitcher ? "rotate-180 transition-transform" : "transition-transform"}/>
            </button>
          </div>
          {/* My team badge — always visible */}
          <div className="flex items-center gap-2">
            {favoriteTeam ? (
              <button onClick={() => setShowPickNextTeam(true)} className="flex items-center gap-2 rounded-full bg-forest px-3 py-1.5 text-xs font-extrabold text-white transition hover:bg-forest/90 shadow-sm">
                {favoriteTeam.flagUrl ? <img src={favoriteTeam.flagUrl} alt={favoriteTeam.name} className="h-5 w-5 object-contain rounded-full bg-white/10" /> : <ShieldCheck size={13} className="opacity-80" />}
                <span className="hidden sm:inline">{favoriteTeam.name}</span>
                <span className="sm:hidden">{favoriteTeam.code}</span>
              </button>
            ) : (
              <button onClick={() => setShowPickNextTeam(true)} className="flex items-center gap-2 rounded-full bg-ink/[0.08] px-3 py-1.5 text-xs font-extrabold text-ink/60 transition hover:bg-ink/15 hover:text-ink">
                <ShieldCheck size={13} />
                <span>Pick team</span>
              </button>
            )}
          </div>
            {showLeagueSwitcher && (
              <div className="absolute left-0 top-full mt-3 w-64 rounded-[24px] border border-ink/10 bg-white p-2 shadow-2xl z-50 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                <div className="mb-2 px-2 pt-1 text-[10px] font-extrabold uppercase tracking-wider text-ink/40">Switch league</div>
                <div className="max-h-[50vh] overflow-y-auto overflow-x-hidden">
                  {Object.entries(groupedLeagues).map(([tName, leagues]: any) => (
                    <div key={tName} className="mb-2 last:mb-0">
                      <div className="px-3 py-1 text-[9px] font-extrabold uppercase tracking-wider text-ink/30">{tName}</div>
                      {leagues.map((l: any) => (
                        <button type="button" key={l.code} onClick={(e) => { e.stopPropagation(); switchLeague(l.code); }} className={`w-full rounded-xl px-3 py-2 text-left text-sm font-bold transition hover:bg-cream cursor-pointer ${l.code === displayLeague?.code ? "bg-lime/20 text-forest" : "text-ink/80"}`}>
                          {l.name}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); setShowLeagueSwitcher(false); setModal(true); }} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-coral transition hover:bg-coral/10 cursor-pointer">
                  <Plus size={14} strokeWidth={3}/> Join / Create
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 relative">
          {/* Last-sync indicator — honest about staleness */}
          {lastSyncInfo && (
            <div className="hidden md:flex items-center gap-2 rounded-full bg-ink/[0.03] px-3 py-1.5 text-[10px] font-extrabold tracking-tight text-ink/50" title={`Matches: ${lastSyncInfo.updated + lastSyncInfo.settled}, Settled: ${lastSyncInfo.settled}`}>
              <span className="h-[6px] w-[6px] rounded-full bg-lime animate-pulse" />
              <span>Synced {formatRelative(lastSyncInfo.at, now ?? new Date())}</span>
            </div>
          )}

          <div className="relative">
            <button onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); setShowLeagueSwitcher(false); }} className="relative grid h-10 w-10 place-items-center rounded-full border border-ink/10 bg-white transition hover:bg-cream">
              <Bell size={17}/>
              {notifications.some(n => !n.readAt) && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-coral ring-2 ring-white"/>}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-full mt-3 w-80 rounded-[24px] border border-ink/10 bg-white p-5 shadow-2xl z-50 origin-top-right">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-lg">Notifications</h3>
                    <button className="text-[10px] font-extrabold uppercase tracking-widest text-lime bg-forest px-2 py-1 rounded-md">{notifications.filter(n => !n.readAt).length} New</button>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full bg-cream grid place-items-center mb-3">
                        <Bell size={20} className="text-ink/30"/>
                      </div>
                      <p className="text-sm font-bold text-ink">You're all caught up!</p>
                      <p className="text-xs font-semibold text-ink/50 mt-1">Check back later for new alerts.</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                      {notifications.map(n => (
                        <div key={n.id} className={`p-3 rounded-xl border ${n.readAt ? 'border-ink/5 bg-cream/50' : 'border-ink/10 bg-cream'}`} onClick={() => !n.readAt && markRead(n.id)}>
                          <p className={`text-sm font-bold ${n.readAt ? 'text-ink/60' : 'text-ink'}`}>{n.title}</p>
                          <p className={`text-xs mt-1 ${n.readAt ? 'text-ink/40' : 'text-ink/70'}`}>{n.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); setShowLeagueSwitcher(false); }} className="flex items-center gap-2 rounded-full border border-ink/10 bg-white p-1.5 pr-3 transition hover:bg-cream">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-lime text-[9px] font-extrabold">{user ? (user.name || user.email).slice(0,2).toUpperCase() : "??"}</span>
              <span className="hidden text-xs font-bold sm:block">{user ? (user.name || user.email.split("@")[0]) : "Guest"}</span>
            </button>
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-full mt-3 w-64 rounded-[24px] border border-ink/10 bg-white p-3 shadow-2xl z-50 origin-top-right">
                  <div className="px-4 py-3 border-b border-ink/5 mb-2">
                    <p className="font-display font-bold text-base truncate">{user?.name || "Guest"}</p>
                    <p className="text-xs font-semibold text-ink/50 truncate">{user?.email || "Not signed in"}</p>
                  </div>
                  <button onClick={() => { setView("settings"); setShowProfileMenu(false); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition hover:bg-cream">
                    <Settings size={16} className="text-ink/50"/> Settings
                  </button>
                  <button onClick={() => signOut()} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-coral transition hover:bg-coral/10 mt-1">
                    <LogOut size={16}/> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
        </div>
      </header>
      <div className="mx-auto max-w-[1480px] px-4 pb-16 pt-7 sm:px-7 lg:px-9 lg:pt-9">
        
        {!displayLeague ? (
          <div className="flex flex-col items-center justify-center pt-32 pb-32 text-center">
            <h1 className="font-display text-4xl font-bold leading-tight">Welcome to PickSix</h1>
            <p className="mt-4 max-w-md text-ink/60 mx-auto">You haven't joined any leagues yet. Create your own private league and invite your friends to start predicting matches.</p>
            <button onClick={() => setModal(true)} className="mt-8 rounded-2xl bg-forest px-6 py-4 text-sm font-extrabold text-white transition hover:scale-[1.02]">
              + Start a league
            </button>
          </div>
        ) : (
          <>
            {view === "overview" && (
              <>
            <section className="noise relative overflow-hidden rounded-[28px] bg-forest px-5 py-7 text-white sm:px-8 sm:py-8">
              <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[42px] border-lime/10"/>
              <div className="absolute bottom-[-75px] right-28 h-44 w-44 rounded-full bg-coral/10 blur-2xl"/>
              <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end">
                <div>
                  <div className="mb-4 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.18em] text-lime">
                    <span className="h-2 w-2 rounded-full bg-lime"/> {openMatches.length ? `${openMatches.length} prediction ${openMatches.length === 1 ? "window" : "windows"} open` : "Picks open 24h before kickoff"}
                  </div>
                  {/* My team card inside hero */}
                  <div className="mt-2 flex items-center gap-3 rounded-xl bg-white/10 p-3 ring-1 ring-white/10">
                    {favoriteTeam ? (
                      <>
                        {favoriteTeam.flagUrl ? <img src={favoriteTeam.flagUrl} alt={favoriteTeam.name} className="h-8 w-8 object-contain rounded-full bg-white/15" /> : <span className="h-8 w-8 flex items-center justify-center rounded-full bg-white/15 text-sm">⚽</span>}
                        <div>
                          <p className="text-xs font-extrabold">My team</p>
                          <p className="text-sm font-display font-bold">{favoriteTeam.name} <span className="text-white/40 text-xs font-bold">{favoriteTeam.code}</span></p>
                        </div>
                        <span className="ml-auto rounded-full bg-lime/20 px-2 py-0.5 text-[9px] font-extrabold text-lime">{favoriteTeam.phase || "League"}</span>
                      </>
                    ) : (
                      <button onClick={() => setShowPickNextTeam(true)} className="flex items-center gap-2 text-xs font-extrabold text-white/70 hover:text-white transition">
                        <ShieldCheck size={14} /> Pick your team
                      </button>
                    )}
                  </div>
                  <h1 className="max-w-2xl font-display text-4xl font-bold leading-[.98] tracking-[-.055em] sm:text-5xl">Call the score.<br/><span className="text-white/45">Claim the bragging rights.</span></h1>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-white/55">Every prediction window opens exactly 24 hours before the match and locks automatically at kickoff.</p>
                </div>
                <div className="flex shrink-0 items-center gap-5 rounded-2xl bg-white/7 p-4 ring-1 ring-white/10">
                  <div className="relative grid h-14 w-14 place-items-center rounded-full" style={{ background: `conic-gradient(#d9ff57 ${completion}%, rgba(255,255,255,.12) 0)` }}>
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-forest text-xs font-extrabold">{completion}%</div>
                  </div>
                  <div>
                    <p className="text-xs font-extrabold">Your open picks</p>
                    <p className="mt-1 text-[11px] text-white/45">{openMatches.length ? `${savedOpenPicks} of ${openMatches.length} predictions saved` : "No picks open right now"}</p>
                  </div>
                </div>
              </div>
            </section>
            
            <section className="mt-9">
              <SectionTitle eyebrow="Up next" title="Make your picks" action="View all matches" onAction={() => setView("predictions")}/>
              <div className="hide-scroll -mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-5 sm:-mx-7 sm:px-7 lg:mx-0 lg:px-0">
                {upcoming.map(m => {
                  const isMyTeam = !!favoriteTeam && (m.home?.id === favoriteTeam.id || m.away?.id === favoriteTeam.id || m.homeTeamId === favoriteTeam.id || m.awayTeamId === favoriteTeam.id);
                  return <MatchCard key={m.id} match={m} saved={predictions[m.id]} onSave={save} members={displayLeague.members} isMyTeam={isMyTeam} />;
                })}
              </div>
            </section>
            
            <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
              <Leaderboard league={displayLeague} userId={user?.id}/>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
                <Invite league={displayLeague} copy={copy}/>
                <Stats 
                  exact={displayLeague.members.find((m: any) => m.id === user?.id)?.exact || 0} 
                  hitRate={0} 
                  streak={0} 
                />
              </div>
            </div>
            
            <section className="mt-10">
              <SectionTitle eyebrow="Final whistle" title="Latest results" action="All results" onAction={() => setView("tournament")}/>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {finished.map((m,i) => (
                  <div key={m.id} className="flex items-center rounded-2xl border border-ink/10 bg-white p-4">
                    <span className="mr-3 rounded-lg bg-cream px-2 py-1 text-[9px] font-extrabold text-ink/40">{m.group?.replace("Group ", "GRP ")}</span>
                    {m.home.flag?.includes?.('://') ? <img src={m.home.flag} alt={m.home.name} className="h-8 w-8 object-contain" /> : <span className="text-xl">{m.home.flag || "🏳️"}</span>}
                    <span className="ml-2 flex-1 text-xs font-extrabold">{m.home.name}</span>
                    <b className="font-display text-lg">{m.homeScore} — {m.awayScore}</b>
                    <span className="mr-2 flex-1 text-right text-xs font-extrabold">{m.away.name}</span>
                    {m.away.flag?.includes?.('://') ? <img src={m.away.flag} alt={m.away.name} className="h-8 w-8 object-contain" /> : <span className="text-xl">{m.away.flag || "🏳️"}</span>}
                    {i === 0 && <span className="ml-3 rounded-full bg-lime px-2 py-1 text-[9px] font-extrabold">+3 exact</span>}
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-10">
              <SectionTitle eyebrow="The fine print" title="How scoring works" action=""/>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <RuleCard
                  points={3}
                  color="bg-lime"
                  label="Exact score"
                  desc="Nail the precise scoreline. Everyone who gets it right scores 3 pts — ties don't cancel."
                />
                <RuleCard
                  points={2}
                  color="bg-forest/10"
                  label="Goal difference"
                  desc="Right margin, different goals (e.g. 3–1 vs 2–0). Everyone who nailed the GD gets 2 pts."
                />
                <RuleCard
                  points={1}
                  color="bg-coral/10"
                  label="Closest pick"
                  desc="Nobody got the exact GD — everyone who was equally closest shares 1 pt."
                />
              </div>
              <div className="mt-3 rounded-2xl border border-ink/8 bg-white px-5 py-4 text-xs text-ink/50 leading-5 font-semibold">
                <span className="font-extrabold text-ink/70">Solo prediction</span> — If you're the only person who predicted a match, you earn 1 pt automatically. Prediction windows open 24 h before kickoff and lock at kickoff time.
              </div>
            </section>
          </>
        )}
        {view === "predictions" && <PredictionsView league={displayLeague} dbMatches={activeMatches} currentUserId={user?.id} />}
        {view === "leaderboard" && <LeaderboardView league={displayLeague} currentUserId={user?.id} onRemove={removeMember} />}
        {view === "tournament" && <TournamentView matches={activeMatches} />}
        {view === "teams" && <TeamsView teams={teams} tournamentName={tournamentName} />}
        {view === "settings" && <SettingsView user={user} league={displayLeague} />}
          </>
        )}
      </div>
    </main>
    <CreateLeagueModal open={modal} onClose={() => setModal(false)} onCreated={created}/>

    {/* Pick next team modal — triggered by elimination */}
    <PickNextTeamModal
      open={showPickNextTeam}
      teams={teams.length ? teams : []}
      currentTeamName={favoriteTeam?.name}
      round={"next round"}
      onPick={async (teamId: string) => {
        const picked = teams.find((t: any) => t.id === teamId);
        if (!picked) return;
        setFavoriteTeam({ ...picked, phase: "knockout" });
        try {
          await fetch("/api/users/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ favoriteTeamId: teamId, phase: "knockout", switchedAt: new Date().toISOString() }),
          });
        } catch (e) { console.error(e); }
        setShowPickNextTeam(false);
        setToast("Team updated — activates next round");
        setTimeout(() => setToast(""), 2000);
      }}
      onDismiss={() => setShowPickNextTeam(false)}
    />
    <AnimatePresence>
      {toast && <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-xs font-extrabold text-white shadow-xl">{toast}</motion.div>}
    </AnimatePresence>
  </div>;
}

function Nav({ icon, label, active, badge, onClick }: { icon: React.ReactNode; label: string; active?: boolean; badge?: number; onClick?: () => void }) { 
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold transition ${active ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white"}`}>
      <span className="[&>svg]:h-[17px] [&>svg]:w-[17px]">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-lime px-1 text-[9px] font-extrabold text-forest">{badge}</span>}
    </button>
  );
}

function SectionTitle({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) { 
  return (
    <div className="flex items-end justify-between">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[.17em] text-coral">{eyebrow}</p>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-[-.045em]">{title}</h2>
      </div>
      {action && <button onClick={onAction} className="flex items-center gap-1 text-[11px] font-extrabold text-ink/50 hover:text-ink">{action}<ChevronRight size={14}/></button>}
    </div>
  );
}

function Leaderboard({ league, userId }: { league: League; userId?: string }) { 
  return (
    <section className="rounded-[24px] border border-ink/10 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-coral">League table</p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-[-.045em]">The race is on</h2>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime"><Trophy size={19}/></span>
      </div>
      <div className="mt-5">
        <div className="grid grid-cols-[32px_1fr_48px_48px] border-b border-ink/8 px-2 pb-2 text-[9px] font-extrabold uppercase tracking-[.12em] text-ink/30">
          <span>#</span><span>Player</span><span className="text-center">Exact</span><span className="text-right">Pts</span>
        </div>
        {league.members.map((m, i) => (
          <div key={m.id} className={`grid grid-cols-[32px_1fr_48px_48px] items-center rounded-xl px-2 py-3 ${m.id === userId ? "bg-lime/20" : "border-b border-ink/5"}`}>
            <span className="text-xs font-extrabold text-ink/40">{i + 1}</span>
            <div className="flex min-w-0 items-center gap-2.5">
              <span style={{ background: m.color }} className="grid h-8 w-8 place-items-center rounded-full text-[9px] font-extrabold">{m.initials}</span>
              <span className="truncate text-xs font-extrabold">{m.name}{i === 0 && <Medal size={12} className="ml-1 inline text-coral"/>}</span>
            </div>
            <span className="text-center text-xs font-bold text-ink/45">{m.exact}</span>
            <span className="text-right font-display text-lg font-bold">{m.points}</span>
          </div>
        ))}
      </div>
    </section>
  ); 
}

function Invite({ league, copy }: { league: League; copy: () => void }) { 
  return (
    <section className="noise overflow-hidden rounded-[24px] bg-coral p-6 text-ink">
      <div className="flex items-start justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/40"><Users size={20}/></span>
        <AvatarStack members={league.members}/>
      </div>
      <h3 className="mt-8 font-display text-2xl font-bold tracking-[-.05em]">More friends,<br/>more chaos.</h3>
      <p className="mt-2 text-xs font-semibold leading-5 text-ink/60">Invite your group with one private link. No code-hunting required.</p>
      <button onClick={copy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-[11px] font-extrabold text-white">
        <Copy size={14}/> Copy invite link
      </button>
    </section>
  );
}

function Stats({ exact = 0, hitRate = 0, streak = 0 }: { exact?: number, hitRate?: number, streak?: number }) { 
  return (
    <section className="rounded-[24px] border border-ink/10 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-ink/35">Your form</p>
          <h3 className="mt-1 font-display text-xl font-bold">{exact > 0 ? "Quietly cooking" : "Warming up"}</h3>
        </div>
        <Sparkles className="text-coral" size={20}/>
      </div>
      <div className="mt-7 grid grid-cols-3 divide-x divide-ink/10">
        <Stat n={exact.toString()} label="Exact"/><Stat n={`${hitRate}%`} label="Hit rate"/><Stat n={streak.toString()} label="Streak"/>
      </div>
      <div className="mt-6 flex items-center gap-2 rounded-xl bg-cream p-3 text-[10px] font-bold text-ink/55">
        <ShieldCheck size={15} className="text-forest"/>{exact > 0 ? "Top 20% of your league this week" : "Make some predictions to get on the board!"}
      </div>
    </section>
  );
}

function Stat({ n, label }: { n: string; label: string }) { 
  return (
    <div className="text-center">
      <p className="font-display text-xl font-bold">{n}</p>
      <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[.11em] text-ink/35">{label}</p>
    </div>
  ); 
}

function RuleCard({ points, color, label, desc }: { points: number; color: string; label: string; desc: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-ink/8 bg-white p-5">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${color} font-display text-lg font-bold`}>{points}</span>
        <p className="font-extrabold text-sm">{label}</p>
      </div>
      <p className="text-xs leading-5 text-ink/55 font-semibold">{desc}</p>
    </div>
  );
}
