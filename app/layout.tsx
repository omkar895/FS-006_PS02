import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "FairRide AI — Intelligent Ride Matching & Allocation",
  description: "Academic prototype for PS2: Intelligent Ride Matching and Dynamic Driver Allocation System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F4F3ED] text-[#18231D] antialiased">
        <header className="border-b border-[#D6DCD2] bg-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-tight text-lg text-[#18231D]">FairRide AI</span>
            <span className="text-xs px-2 py-0.5 rounded bg-[#EAECE5] text-[#35423A] font-medium border border-[#D6DCD2]">
              PS2 PROTOTYPE
            </span>
          </div>
          <nav className="flex items-center gap-4 text-sm font-medium text-[#35423A]">
            <Link href="/login" className="px-2.5 py-1 text-xs font-semibold rounded bg-[#245A43] text-white hover:bg-[#1b4332] transition-colors">
              Sign In
            </Link>
            <Link href="/overview" className="hover:text-[#245A43] transition-colors">Overview</Link>
            <Link href="/passenger" className="hover:text-[#245A43] transition-colors">Passenger</Link>
            <Link href="/driver" className="hover:text-[#245A43] transition-colors">Driver</Link>
            <Link href="/admin" className="hover:text-[#245A43] transition-colors">Admin Console</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
