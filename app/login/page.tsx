"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-ink/10">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        <h1 className="text-2xl font-display font-bold text-center mb-6 tracking-tight">Sign back in</h1>
        
        {error && <div className="bg-coral/10 text-coral font-bold text-sm p-3 rounded-lg mb-4 text-center">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-cream border border-ink/10 rounded-xl px-4 py-3 outline-none focus:border-lime focus:ring-2 focus:ring-lime/20 transition text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-cream border border-ink/10 rounded-xl px-4 py-3 outline-none focus:border-lime focus:ring-2 focus:ring-lime/20 transition text-sm"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="w-full bg-lime text-forest font-extrabold py-3.5 rounded-xl hover:scale-[1.02] transition">
            Sign In
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm font-semibold text-ink/60">
          Don't have an account? <Link href="/signup" className="text-forest hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
