"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/auth/client";
import Link from "next/link";

type RoleType = "passenger" | "driver" | "admin";

const ROLE_CONFIGS = {
  passenger: {
    label: "Passenger",
    targetUrl: "/passenger",
    demoEmail: "passenger@fairride.demo",
    demoPassword: "DemoPassword123!",
    description: "Book rides, monitor nearby vehicle availability, and review upfront estimated fares.",
    badge: "Urban Rider",
  },
  driver: {
    label: "Driver",
    targetUrl: "/driver",
    demoEmail: "driver-alpha@fairride.demo",
    demoPassword: "DemoPassword123!",
    description: "Accept fairness-scored dispatch offers, update trip status milestones, and toggle fleet availability.",
    badge: "Fleet Operator",
  },
  admin: {
    label: "Administrator",
    targetUrl: "/admin",
    demoEmail: "admin@fairride.demo",
    demoPassword: "DemoPassword123!",
    description: "Inspect 30-min predictive zone demand, surge pressure, and execute comparative dispatch simulations.",
    badge: "Operations Command",
  },
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") as RoleType) || "passenger";

  const [activeRole, setActiveRole] = useState<RoleType>(
    ["passenger", "driver", "admin"].includes(initialRole) ? initialRole : "passenger"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = ROLE_CONFIGS[activeRole];

  const switchRole = (role: RoleType) => {
    setActiveRole(role);
    setError(null);
    setEmail("");
    setPassword("");
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const redirectOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const { error: oAuthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${redirectOrigin}/auth/callback?next=${encodeURIComponent(config.targetUrl)}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (oAuthError) {
        throw new Error(oAuthError.message);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Google sign-in requires Google OAuth credentials configured in your Supabase project dashboard."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      router.push(config.targetUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setDemoLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: config.demoEmail,
        password: config.demoPassword,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      router.push(config.targetUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in with demo account");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white border border-zinc-200/90 rounded-3xl shadow-[0_12px_40px_rgb(0,0,0,0.08)] overflow-hidden">
      {/* Header */}
      <div className="p-7 border-b border-zinc-200/80 bg-zinc-50/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Go-Fair Access</span>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
            {config.badge}
          </span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-950 mt-2">Sign In to Continue</h1>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{config.description}</p>
      </div>

      {/* Role Tabs */}
      <div className="grid grid-cols-3 border-b border-zinc-200 bg-zinc-100/70 p-1.5 gap-1.5 text-xs font-bold">
        {(["passenger", "driver", "admin"] as RoleType[]).map((role) => (
          <button
            key={role}
            onClick={() => switchRole(role)}
            className={`py-2.5 text-center transition-all rounded-xl ${
              activeRole === role
                ? "bg-white text-zinc-950 shadow-xs font-extrabold"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {ROLE_CONFIGS[role].label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="p-7 space-y-6">
        {error && (
          <div className="p-3.5 text-xs bg-red-50 border border-red-200 text-red-700 rounded-2xl font-medium">
            {error}
          </div>
        )}

        {/* Google Authorization Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full py-3.5 px-4 bg-white hover:bg-zinc-50 text-zinc-900 text-xs font-bold rounded-2xl border border-zinc-200 shadow-xs transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-zinc-200"></div>
          <span className="flex-shrink mx-3 text-[10px] text-zinc-400 uppercase font-black tracking-wider">
            or instant demo access
          </span>
          <div className="flex-grow border-t border-zinc-200"></div>
        </div>

        {/* 1-Click Demo Login Box */}
        <div className="p-5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">Fast Demo Access</span>
            <span className="text-[10px] bg-white text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
              1-Click Pitch Ready
            </span>
          </div>
          <p className="text-xs text-emerald-800 mb-3.5 leading-relaxed">
            Sign in instantly as <span className="font-bold">{config.demoEmail}</span> without typing credentials.
          </p>
          <button
            onClick={handleQuickDemoLogin}
            disabled={demoLoading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            {demoLoading ? "Authenticating..." : `⚡ Sign In as Demo ${config.label}`}
          </button>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-zinc-200"></div>
          <span className="flex-shrink mx-3 text-[10px] text-zinc-400 uppercase font-semibold">or custom credentials</span>
          <div className="flex-grow border-t border-zinc-200"></div>
        </div>

        {/* Custom Credentials Form */}
        <form onSubmit={handleCustomLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-zinc-900 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={`e.g. your-email@domain.com`}
              className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
            />
          </div>

          <div>
            <label className="block font-bold text-zinc-900 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all shadow-sm active:scale-[0.99]"
          >
            {loading ? "Authenticating..." : `Sign In with Email`}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="px-7 py-4 bg-zinc-50 border-t border-zinc-200 text-center text-xs text-zinc-500 font-medium">
        <Link href="/" className="hover:text-black transition-colors">
          &larr; Return to System Overview
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto my-12 text-center text-xs text-gray-500">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}
