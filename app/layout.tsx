import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Go-Fair — Intelligent Ride Matching & Allocation",
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
          <nav className="flex items-center gap-3 md:gap-5 text-xs font-semibold text-[#35423A]">
            <Link href="/overview" className="hover:text-[#245A43] transition-colors py-1">Overview</Link>
            <Link href="/passenger" className="hover:text-[#245A43] transition-colors py-1">Passenger</Link>
            <Link href="/driver" className="hover:text-[#245A43] transition-colors py-1">Driver</Link>
            <Link href="/admin" className="hover:text-[#245A43] transition-colors py-1">Admin Console</Link>
            <Link
              href="/login"
              className="px-3 py-1.5 text-xs font-bold rounded bg-[#245A43] text-white hover:bg-[#1b4332] shadow-sm transition-colors"
            >
              Sign In
            </Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
