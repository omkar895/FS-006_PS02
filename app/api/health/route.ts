import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "FairRide AI Prototype",
    version: "0.1.0",
    phase: "00_REPOSITORY_AUDIT_AND_SCAFFOLD",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
}
