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
    <header className="border-b border-[#D6DCD2] bg-white px-6 py-2.5 flex items-center justify-between sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3">
        <Link href="/overview" className="flex items-center gap-2">
          <span className="font-extrabold tracking-tight text-xl text-[#245A43]">Go-Fair</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#EAF2ED] text-[#245A43] font-bold border border-[#245A43]/20">
            PS2 PROTOTYPE
          </span>
        </Link>
        <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-[#D6DCD2] text-[11px] text-[#68746C]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#245A43] animate-pulse"></span>
          <span>Bengaluru Fleet Grid</span>
        </div>
        <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EAF2ED] border border-[#245A43]/20 text-[10px] text-[#245A43] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#245A43] animate-ping"></span>
          <span>Realtime WebSockets Active</span>
        </div>
      </div>

      {/* Role-isolated Navigation Links */}
      <nav className="flex items-center gap-3 md:gap-4 text-xs font-semibold text-[#35423A]">
        <Link
          href="/overview"
          className={`hover:text-[#245A43] transition-colors py-1 ${
            pathname === "/overview" ? "text-[#245A43] font-bold border-b-2 border-[#245A43]" : ""
          }`}
        >
          Overview
        </Link>

        {/* PASSENGER VIEW: Strict privacy - Hides Driver Terminal & Admin Console */}
        {role === "passenger" && (
          <>
            <Link
              href="/passenger"
              className={`hover:text-[#245A43] transition-colors py-1 ${
                pathname === "/passenger" ? "text-[#245A43] font-bold border-b-2 border-[#245A43]" : ""
              }`}
            >
              Book Rides
            </Link>
            <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAF2ED] text-[#245A43] border border-[#245A43]/20">
              ● Rider Account
            </span>
          </>
        )}

        {/* DRIVER VIEW: Strict privacy - Hides Passenger Booking & Admin Console */}
        {role === "driver" && (
          <>
            <Link
              href="/driver"
              className={`hover:text-[#245A43] transition-colors py-1 ${
                pathname === "/driver" ? "text-[#245A43] font-bold border-b-2 border-[#245A43]" : ""
              }`}
            >
              Driver Terminal
            </Link>
            <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-[#FAF9F5] text-[#18231D] border border-[#D6DCD2]">
              ● Driver Alpha
            </span>
          </>
        )}

        {/* ADMIN VIEW: Supervisor command center */}
        {role === "admin" && (
          <>
            <Link
              href="/admin"
              className={`hover:text-[#245A43] transition-colors py-1 ${
                pathname === "/admin" ? "text-[#245A43] font-bold border-b-2 border-[#245A43]" : ""
              }`}
            >
              Admin Console
            </Link>
            <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-[#D6EE74] text-[#18231D] border border-[#245A43]/30">
              ● Operations Command
            </span>
          </>
        )}

        {/* GUEST / PUBLIC VIEW: Landing navigation */}
        {role === "guest" && (
          <>
            <Link href="/passenger" className="hover:text-[#245A43] transition-colors py-1">
              Passenger
            </Link>
            <Link href="/driver" className="hover:text-[#245A43] transition-colors py-1">
              Driver
            </Link>
            <Link href="/admin" className="hover:text-[#245A43] transition-colors py-1">
              Admin
            </Link>
          </>
        )}

        {/* Action Button: Sign Out if in a portal, Sign In if Guest */}
        {role !== "guest" ? (
          <button
            onClick={handleSignOut}
            className="px-2.5 py-1 text-[11px] font-bold rounded border border-[#D6DCD2] text-[#68746C] hover:text-[#B7443E] hover:border-[#B7443E] transition-colors"
          >
            Sign Out
          </button>
        ) : (
          <Link
            href="/login"
            className="px-3 py-1.5 text-xs font-bold rounded bg-[#245A43] text-white hover:bg-[#1b4332] shadow-sm transition-colors"
          >
            Sign In
          </Link>
        )}
      </nav>
    </header>
  );
}
