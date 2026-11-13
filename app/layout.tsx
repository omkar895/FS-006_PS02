import type { Metadata } from "next";
import NavBar from "@/components/navigation/navbar";
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
        <NavBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
