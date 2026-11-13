import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export const runtime = "nodejs";

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        text: z.string(),
      })
    )
    .optional()
    .default([]),
});

const SYSTEM_INSTRUCTION = `You are the FairRide AI Concierge, a helpful, intelligent urban transit assistant for the Go-Fair AI ride-hailing and dynamic allocation system in Bengaluru.

Key Platform Knowledge:
1. Ride Choices:
   - Cab / Car: Go-Fair Prime (up to 4 members, ₹50 base + ₹15/km), Go-Fair Eco-Pool (saves 20% fare & CO2, up to 2 members to allow sharing), and Express EV.
   - Bike / Moto: Quick, nimble two-wheeler for beating Bengaluru peak traffic, ₹25 base + ₹8/km, strictly 1 rider for safety.
2. Traveling Members:
   - Passengers can select 1, 2, 3, or 4 members for Cabs.
   - Bikes are locked to strictly 1 member.
   - Eco-Pool is capped at 2 members per booking to guarantee room for co-riders.
3. Multi-Factor Fairness (PS2):
   - Rather than simple nearest-driver matching, Go-Fair uses a 5-factor normalized scoring formula: Pickup ETA (30%), Idle Time (25%), Distance (20%), Workload Equity (15%), Acceptance Reliability (10%). This reduces driver starvation by >60%.
4. Automatic Reassignment Radar:
   - Multi-wave dispatch: Wave 1 (5 km proximity), Wave 2 (25 km dynamic radius expansion), Wave 3 (regional corridor allocation). 30-second driver timeout protection.
5. Bengaluru Transit & Metro:
   - Direct connection to Namma Metro stations (Purple & Green lines) for seamless multi-modal journeys.

Tone: Keep answers concise, helpful, friendly, and properly formatted with bullet points or bold text where appropriate. Never fabricate booking IDs or pretend to process financial transactions directly.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid message input", 400);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return apiError("CONFIG_ERROR", "Gemini API key is not configured", 500);
    }

    const { message, history } = parsed.data;

    // Convert past history to Gemini contents format
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Add prior dialogue context
    for (const h of history.slice(-6)) {
      contents.push({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }],
      });
    }

    // Add current user prompt
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 600,
      },
    };

    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      const errorDetail = data.error?.message || "Failed to generate AI response";
      // Graceful fallback response
      return apiSuccess({
        reply: `Hello! I am your FairRide AI assistant. You can choose between **Cab** (up to 4 members) and **Bike** (1 rider, ₹25 base + ₹8/km). Let me know your pickup and destination in Bengaluru and I'll help you pick the best route! (${errorDetail})`,
      });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I am here to help you navigate rides, pricing, pooling and fleet allocation across Bengaluru.";

    return apiSuccess({ reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error contacting AI assistant";
    return apiError("AI_CHAT_ERROR", msg, 500);
  }
}
