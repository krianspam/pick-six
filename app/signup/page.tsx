"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import Link from "next/link";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Failed to create account");
        return;
      }
      
      const loginRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (loginRes?.error) {
        setError("Account created but failed to log in");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-ink/10">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        <h1 className="text-2xl font-display font-bold text-center mb-6 tracking-tight">Create your account</h1>
        
        {error && <div className="bg-coral/10 text-coral font-bold text-sm p-3 rounded-lg mb-4 text-center">{error}</div>}
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold mb-1">Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-cream border border-ink/10 rounded-xl px-4 py-3 outline-none focus:border-lime focus:ring-2 focus:ring-lime/20 transition text-sm"
              placeholder="Your Name"
            />
          </div>
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
              minLength={6}
            />
          </div>
          <button type="submit" className="w-full bg-lime text-forest font-extrabold py-3.5 rounded-xl hover:scale-[1.02] transition">
            Sign Up
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm font-semibold text-ink/60">
          Already have an account? <Link href="/login" className="text-forest hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
