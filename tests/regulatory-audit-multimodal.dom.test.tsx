import { describe, it, expect } from "vitest";
import { findNearestMetroStation } from "@/lib/utils/metro-stations";
import { GET } from "@/app/api/audit/export/route";
import { NextRequest } from "next/server";

describe("Phase 4: Regulatory Audit & Multi-Modal Metro Connection Tests", () => {
  it("computes nearest Namma Metro station and realistic connection ETA", () => {
    // Coordinates near Central Railway Station / Majestic (12.9784, 77.5683)
    const result = findNearestMetroStation(12.9784, 77.5683);

    expect(result.station).toBeDefined();
    expect(result.station.name).toContain("Majestic");
    expect(result.distanceKm).toBeGreaterThan(0);
    expect(result.transitMinutes).toBeGreaterThanOrEqual(3);
  });

  it("resolves Indiranagar Metro for East Tech Park coordinates", () => {
    // Coordinates near Indiranagar 100ft road (12.9780, 77.6400)
    const result = findNearestMetroStation(12.9780, 77.6400);

    expect(result.station.name).toContain("Indiranagar");
    expect(result.station.line).toBe("Purple Line");
    expect(result.distanceKm).toBeLessThan(1.0);
  });

  it("exports tamper-proof statutory RTO audit logs in CSV format", async () => {
    const req = new NextRequest("http://localhost:3000/api/audit/export?format=csv");
    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain("go-fair-rto-regulatory-audit.csv");

    const text = await response.text();
    expect(text).toContain("Event ID,Timestamp,Ride ID,Event Type");
    expect(text).toContain("RIDE_REQUESTED");
    expect(text).toContain("0x"); // Cryptographic proof hash
  });

  it("exports tamper-proof statutory RTO audit logs in JSON format", async () => {
    const req = new NextRequest("http://localhost:3000/api/audit/export?format=json");
    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(response.headers.get("Content-Disposition")).toContain("go-fair-rto-regulatory-audit.json");

    const json = await response.json();
    expect(json.regulatoryBody).toContain("Karnataka State Transport Authority (RTO)");
    expect(json.records).toBeDefined();
    expect(json.records.length).toBeGreaterThan(0);
  });
});
