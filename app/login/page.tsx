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
  const [error, setError] = useState<string | null>(null);

  const config = ROLE_CONFIGS[activeRole];

  const switchRole = (role: RoleType) => {
    setActiveRole(role);
    setError(null);
    setEmail("");
    setPassword("");
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
    <div className="max-w-md mx-auto my-12 bg-white border border-[#D6DCD2] rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#D6DCD2] bg-[#FAF9F5]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#68746C]">FairRide AI Access</span>
          <span className="text-xs px-2 py-0.5 rounded bg-[#EAF2ED] text-[#245A43] font-semibold border border-[#245A43]/20">
            {config.badge}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#18231D] mt-1">Sign In to Continue</h1>
        <p className="text-xs text-[#68746C] mt-1">{config.description}</p>
      </div>

      {/* Role Tabs */}
      <div className="grid grid-cols-3 border-b border-[#D6DCD2] bg-[#F4F3ED] text-xs font-semibold">
        {(["passenger", "driver", "admin"] as RoleType[]).map((role) => (
          <button
            key={role}
            onClick={() => switchRole(role)}
            className={`py-3 text-center transition-colors border-b-2 ${
              activeRole === role
                ? "bg-white text-[#245A43] border-[#245A43] font-bold"
                : "text-[#68746C] border-transparent hover:text-[#18231D]"
            }`}
          >
            {ROLE_CONFIGS[role].label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {error && (
          <div className="p-3 text-xs bg-red-50 border border-red-200 text-[#B7443E] rounded">
            {error}
          </div>
        )}

        {/* 1-Click Demo Login Box */}
        <div className="p-4 bg-[#F2F6F3] border border-[#245A43]/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#245A43] uppercase tracking-wider">Fast Demo Access</span>
            <span className="text-[10px] bg-white text-[#245A43] px-2 py-0.5 rounded border border-[#245A43]/20 font-medium">
              1-Click Pitch Ready
            </span>
          </div>
          <p className="text-xs text-[#35423A] mb-3">
            Sign in instantly as <span className="font-semibold">{config.demoEmail}</span> without typing credentials.
          </p>
          <button
            onClick={handleQuickDemoLogin}
            disabled={demoLoading}
            className="w-full py-2.5 px-4 bg-[#245A43] hover:bg-[#1b4332] text-white text-xs font-bold rounded shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {demoLoading ? "Authenticating..." : `⚡ Sign In as Demo ${config.label}`}
          </button>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#D6DCD2]"></div>
          <span className="flex-shrink mx-3 text-xs text-[#68746C] uppercase font-semibold">or custom credentials</span>
          <div className="flex-grow border-t border-[#D6DCD2]"></div>
        </div>

        {/* Custom Credentials Form */}
        <form onSubmit={handleCustomLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#18231D] mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={`e.g. your-email@domain.com`}
              className="w-full px-3 py-2 border border-[#D6DCD2] rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#245A43]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#18231D] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              className="w-full px-3 py-2 border border-[#D6DCD2] rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#245A43]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 border border-[#D6DCD2] bg-white hover:bg-[#EAECE5] text-[#18231D] font-bold rounded transition-colors"
          >
            {loading ? "Authenticating..." : `Sign In with Email`}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-[#FAF9F5] border-t border-[#D6DCD2] text-center text-xs text-[#68746C]">
        <Link href="/" className="hover:underline text-[#245A43]">
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
