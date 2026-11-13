"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/auth/client";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [authRole, setAuthRole] = useState<"passenger" | "driver" | "admin" | null>(null);

  useEffect(() => {
    let ignore = false;
    async function checkAuth() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!ignore && session?.user) {
          const email = session.user.email || "";
          if (email.includes("admin")) {
            setAuthRole("admin");
          } else if (email.includes("driver")) {
            setAuthRole("driver");
          } else if (email.includes("passenger")) {
            setAuthRole("passenger");
          }
        }
      } catch {
        // Fallback
      }
    }
    checkAuth();

    return () => {
      ignore = true;
    };
  }, []);

  // Derive active view role from current route and session role
  const role: "passenger" | "driver" | "admin" | "guest" = pathname.startsWith("/passenger")
    ? "passenger"
    : pathname.startsWith("/driver")
    ? "driver"
    : pathname.startsWith("/admin")
    ? "admin"
    : authRole ?? "guest";

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Fallback
    }
    router.push("/login");
  };

  return (
    <header className="border-b border-zinc-200/80 bg-white/95 backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-4">
        <Link href="/overview" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition-transform">
            GF
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-xl text-black">Go-Fair</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-[9px] tracking-wider uppercase font-bold text-zinc-500 -mt-1">
              Intelligent Mobility AI
            </span>
          </div>
        </Link>
        <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-zinc-200 text-xs text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium text-zinc-700">Bengaluru Fleet Grid</span>
        </div>
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] text-emerald-800 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
          <span>Realtime WebSockets Active</span>
        </div>
      </div>

      {/* Role-isolated Navigation Links */}
      <nav className="flex items-center gap-2 sm:gap-3 text-xs font-semibold text-zinc-700">
        <Link
          href="/overview"
          className={`px-3 py-1.5 rounded-full transition-all ${
            pathname === "/overview"
              ? "bg-black text-white shadow-xs font-bold"
              : "hover:bg-zinc-100 hover:text-black"
          }`}
        >
          Overview
        </Link>

        {/* PASSENGER VIEW: Strict privacy - Hides Driver Terminal & Admin Console */}
        {role === "passenger" && (
          <>
            <Link
              href="/passenger"
              className={`px-3 py-1.5 rounded-full transition-all ${
                pathname === "/passenger"
                  ? "bg-black text-white shadow-xs font-bold"
                  : "hover:bg-zinc-100 hover:text-black"
              }`}
            >
              Book Rides
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Rider Account
            </span>
          </>
        )}

        {/* DRIVER VIEW: Strict privacy - Hides Passenger Booking & Admin Console */}
        {role === "driver" && (
          <>
            <Link
              href="/driver"
              className={`px-3 py-1.5 rounded-full transition-all ${
                pathname === "/driver"
                  ? "bg-black text-white shadow-xs font-bold"
                  : "hover:bg-zinc-100 hover:text-black"
              }`}
            >
              Driver Terminal
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Driver Alpha
            </span>
          </>
        )}

        {/* ADMIN VIEW: Supervisor command center */}
        {role === "admin" && (
          <>
            <Link
              href="/admin"
              className={`px-3 py-1.5 rounded-full transition-all ${
                pathname === "/admin"
                  ? "bg-black text-white shadow-xs font-bold"
                  : "hover:bg-zinc-100 hover:text-black"
              }`}
            >
              Admin Console
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Operations Command
            </span>
          </>
        )}

        {/* GUEST / PUBLIC VIEW: Landing navigation */}
        {role === "guest" && (
          <>
            <Link
              href="/passenger"
              className="px-3 py-1.5 rounded-full hover:bg-zinc-100 hover:text-black transition-all"
            >
              Passenger
            </Link>
            <Link
              href="/driver"
              className="px-3 py-1.5 rounded-full hover:bg-zinc-100 hover:text-black transition-all"
            >
              Driver
            </Link>
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-full hover:bg-zinc-100 hover:text-black transition-all"
            >
              Admin
            </Link>
          </>
        )}

        {/* Action Button: Sign Out if in a portal, Sign In if Guest */}
        {role !== "guest" ? (
          <button
            onClick={handleSignOut}
            className="ml-1 px-3 py-1.5 text-xs font-bold rounded-full border border-zinc-200 text-zinc-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-all"
          >
            Sign Out
          </button>
        ) : (
          <Link
            href="/login"
            className="ml-1 px-4 py-1.5 text-xs font-bold rounded-full bg-black text-white hover:bg-zinc-800 shadow-sm transition-all"
          >
            Sign In
          </Link>
        )}
      </nav>
    </header>
  );
}
