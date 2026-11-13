import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { calculateFareEstimate } from "@/lib/algorithms/pricing";

describe("Vehicle Selection (Cab vs Bike) & Fare Calculations", () => {
  it("calculates standard cab fares with base ₹50 and ₹15/km rate", () => {
    const cabFare = calculateFareEstimate(10, 1.0, 30, "cab");
    expect(cabFare.baseFare).toBe(50);
    expect(cabFare.distanceFare).toBe(150);
    expect(cabFare.fareEstimate).toBe(200);
    expect(cabFare.tripEtaMinutes).toBe(20);
  });

  it("calculates discounted bike fares with base ₹25 and ₹8/km rate", () => {
    const bikeFare = calculateFareEstimate(10, 1.0, 30, "bike");
    expect(bikeFare.baseFare).toBe(25);
    expect(bikeFare.distanceFare).toBe(80);
    expect(bikeFare.fareEstimate).toBe(105);
    // Bike fare is roughly half the cab fare
    expect(bikeFare.fareEstimate).toBeLessThan(200);
    // Bike has nimbler city ETA
    expect(bikeFare.tripEtaMinutes).toBeLessThanOrEqual(20);
  });
});

describe("AI Chatbot API Route Handlers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.GEMINI_API_KEY = "test-gemini-key";
  });

  it("handles valid messages and delegates to Gemini API", async () => {
    const mockGeminiResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: "Hello! Cabs seat up to 4 members, while Bikes carry 1 passenger." }],
          },
        },
      ],
    };

    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGeminiResponse),
    } as Response);

    const { POST } = await import("@/app/api/chat/route");
    const req = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "What is the difference between cab and bike?",
      }),
    });

    const res = await POST(req as unknown as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.reply).toContain("Cabs seat up to 4 members");
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("rejects empty messages with validation error", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const req = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "",
      }),
    });

    const res = await POST(req as unknown as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });
});
