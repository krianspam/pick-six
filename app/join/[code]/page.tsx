"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Check, LockKeyhole, Trophy, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/logo";
import { demoLeague } from "@/lib/data";
import { useSession } from "next-auth/react";

export default function JoinLeaguePage() {
  const { code } = useParams<{ code: string }>(); 
  const [joined, setJoined] = useState(false);
  const [leagueData, setLeagueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();

  const join = async () => {
    if (!session?.user?.id) {
      router.push(`/signup?callbackUrl=/join/${code}`);
      return;
    }

    try {
      const joinRes = await fetch(`/api/leagues/${code?.toUpperCase()}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const joinData = await joinRes.json();
      if (joinData.error && joinData.error !== "Already a member") throw new Error(joinData.error);

      localStorage.setItem('lastLeague', code.toUpperCase());
      setJoined(true);
    } catch (err: any) {
      alert(err.message || "Failed to join league");
    }
  };

  useEffect(() => {
    if (!code) return;
    fetch(`/api/leagues/${code.toUpperCase()}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setLeagueData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [code]);

  const numPlayers = leagueData?.members?.length || 0;
  const topScore = leagueData?.members?.[0]?.points || 0;

  return <main className="noise relative grid min-h-screen place-items-center overflow-hidden bg-forest px-4 py-10 text-white">
    <div className="absolute left-[-90px] top-[-110px] h-80 w-80 rounded-full border-[55px] border-lime/10"/>
    <div className="absolute bottom-[-100px] right-[-60px] h-80 w-80 rounded-full bg-coral/10 blur-3xl"/>
    <div className="relative w-full max-w-md">
      <div className="mb-7 flex justify-center"><Logo light/></div>
      <motion.section initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="overflow-hidden rounded-[30px] bg-cream text-ink shadow-2xl">
        <div className="bg-lime px-7 py-6">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.16em]"><LockKeyhole size={14}/> Private league</span>
            <span className="rounded-full bg-forest px-3 py-1.5 text-[10px] font-extrabold text-white">{code?.toUpperCase()}</span>
          </div>
          <h1 className="mt-8 font-display text-4xl font-bold leading-[.95] tracking-[-.06em]">You’re on<br/>the team sheet.</h1>
          <p className="mt-3 text-sm font-semibold text-ink/55">You've been invited to join {loading ? "..." : leagueData?.name || "this league"}.</p>
        </div>
        {!joined ? (
          <div className="p-7">
            <div className="flex gap-3">
              <Mini icon={<Users/>} n={loading ? "-" : numPlayers.toString()} label="players"/>
              <Mini icon={<Trophy/>} n={loading ? "-" : topScore.toString()} label="top score"/>
            </div>
            {status === "unauthenticated" ? (
              <div className="mt-7">
                <p className="text-sm font-semibold text-ink/60 text-center mb-4">Please log in or sign up to join.</p>
                <Link href={`/login?callbackUrl=/join/${code}`} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-ink/20 px-5 py-3 text-sm font-extrabold text-ink transition hover:bg-ink/5">
                  Log In
                </Link>
                <Link href={`/signup?callbackUrl=/join/${code}`} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-forest px-5 py-4 text-sm font-extrabold text-white transition hover:bg-ink">
                  Sign Up <ArrowRight size={17}/>
                </Link>
              </div>
            ) : (
              <button onClick={join} className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-forest px-5 py-4 text-sm font-extrabold text-white transition hover:bg-ink">
                Join the league as {session?.user?.name || session?.user?.email} <ArrowRight size={17}/>
              </button>
            )}
            <p className="mt-5 text-center text-[10px] leading-4 text-ink/35">By joining, you agree to keep the trash talk<br/>competitive and mostly tasteful.</p>
          </div>
        ) : (
          <div className="p-8 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime"><Check size={28} strokeWidth={3}/></span>
            <h2 className="mt-5 font-display text-2xl font-bold tracking-[-.04em]">Welcome!</h2>
            <p className="mt-2 text-sm text-ink/50">Your first three fixtures are ready to predict.</p>
            <Link href="/" className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-forest px-5 py-4 text-sm font-extrabold text-white">Go make your picks <ArrowRight size={17}/></Link>
          </div>
        )}
      </motion.section>
      <p className="mt-5 text-center text-[10px] font-semibold text-white/35">Invite links only grant access to this private league.</p>
    </div>
  </main>;
}
function Mini({ icon, n, label }: { icon: React.ReactNode; n: string; label: string }) { return <div className="flex flex-1 items-center gap-3 rounded-2xl bg-white p-3.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-forest/7 [&>svg]:h-4 [&>svg]:w-4">{icon}</span><div><p className="font-display text-lg font-bold leading-none">{n}</p><p className="mt-1 text-[9px] font-extrabold uppercase tracking-[.1em] text-ink/35">{label}</p></div></div> }
