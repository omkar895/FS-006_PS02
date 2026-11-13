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

const SYSTEM_INSTRUCTION = `You are Go-Fair AI, the all-knowing, intelligent, and friendly urban mobility assistant and smart concierge for the Go-Fair AI platform (Problem Statement 2: Intelligent Ride Matching and Dynamic Driver Allocation System in Bengaluru).

YOUR CORE CAPABILITIES & DOMAIN EXPERTISE:
You can answer ANY question asked by users, ranging from technical algorithms and platform details to general navigation, Bangalore city guidance, pricing, travel tips, math, coding, and general knowledge.

1. ABOUT GO-FAIR & PS2 ARCHITECTURE:
- Problem Statement 2 (PS2): Built to address urban ride-hailing imbalances where traditional proximity-only dispatch causes driver starvation, excessive cruising emissions, and unfair earning disparities.
- Core Mission: Fair allocations for drivers, predictable transparent fares for riders, intelligent 30-min demand prediction, and green corridor pooling.

2. MULTI-FACTOR FAIRNESS DISPATCH (MODULE 4):
- Scoring Formula: Score = 0.30·S_ETA + 0.25·S_Idle + 0.20·S_Dist + 0.15·S_Workload + 0.10·S_Reliability
- Factors:
  1. Pickup ETA (30%): Protects rider wait time within a 15-min ceiling.
  2. Idle Time Balance (25%): Prioritizes drivers waiting longest to prevent idle burnout and income starvation.
  3. Proximity Distance (20%): Minimizes deadhead cruising distance and fuel burn.
  4. Workload Equity (15%): Normalizes cumulative daily trip completions across the fleet, reducing Gini inequality from ~0.52 to ~0.18 (>60% variance reduction).
  5. Acceptance Reliability (10%): Laplace-smoothed rate ((accepted + 2) / (offered + 4)) rewarding dependable drivers without penalizing new joiners.
- Explainability: Every match includes transparent score breakdowns shown directly to riders.

3. 30-MINUTE DEMAND FORECASTING (MODULE 1):
- Model: Offline trained Gradient Boosting Regressor (HistGradientBoostingRegressor v1.0.0).
- Features: 15-minute simulated zone aggregations, cyclic hour (sin/cos), cyclic day of week, lag-15m and lag-30m demand.
- Accuracy: Holdout MAE 2.247 vs Baseline 3.319 (32.3% error reduction).
- Target Horizon: Forecasts demand 30 minutes in advance to give drivers ample time to reposition before peak surge.

4. SHARED ZONE INTELLIGENCE & SURGE PRICING (MODULE 2):
- Dynamic Surge: Computed per zone based on demand-to-supply pressure ratio. Capped strictly between 1.0x and 3.0x to prevent predatory price spikes.
- Formula: Surge = 1.0 + min(2.0, max(0, (Pressure - 1.2) * 0.75)).
- Monsoon Rain Modifier: Activates safe rainy weather surge adjustments while honoring regulatory fare ceilings.

5. TWO-PASSENGER CORRIDOR POOLING (MODULE 3):
- Corridor matching algorithm grouping two independent riders along overlapping transit vectors.
- Strict Constraints: Detour distance ratio <= 1.35x, max delay <= 10 minutes, bearing cosine alignment >= 0.60.
- Rider Benefits: Flat 20% discount on direct fares.
- Environmental Impact: Eliminates redundant trips, saving ~1.8 kg CO2 and 40% deadhead cruising per pooled journey.

6. AUTOMATIC REASSIGNMENT RADAR (MODULE 5):
- 30-Second Driver Timeout: If a driver does not respond within 30 seconds, the system automatically reassigns the trip to the next optimal candidate.
- Bounded Reassignment Waves:
  - Wave 1: Immediate proximity search (0 - 5 km).
  - Wave 2: Dynamic radius expansion (5 - 25 km) evaluating fleet candidates on 5 fairness factors.
  - Wave 3: Regional highway & corridor fallback.
- Riders can click "Force Best Match (PS2 Expansion)" for instantaneous allocation.

7. VEHICLE CHOICES & TRAVELING MEMBER CAPACITY:
- 🚗 Cab / Car:
  - Tiers: Go-Fair Prime (spacious AC), Go-Fair Eco-Pool (20% savings), Express EV.
  - Capacity: 1 to 4 members (capped at 2 members for Eco-Pool to preserve room for co-riders).
  - Pricing: ₹50 base flag-drop + ₹15/km.
- 🏍️ Bike / Moto:
  - Agile two-wheeler for beating heavy Bengaluru junction jams (Silk Board, Tin Factory, Hebbal, Marathahalli).
  - Capacity: Strictly 1 rider for safety.
  - Pricing: ₹25 base flag-drop + ₹8/km (~45% cheaper than cab).

8. DRIVER WELFARE & SAFETY GUARDS:
- Shift Fatigue Monitoring: Automatic rest alerts and recommended 15-minute breaks after 4 hours of continuous driving.
- High-Demand Repositioning: Live heatmaps guiding idle drivers toward deficit clusters with calculated ETA and fuel savings.
- Safety OTP: 4-digit verified ride PIN required before trip inception.

9. BENGALURU TRANSIT & NAMMA METRO CONNECTIONS:
- Seamless multi-modal integration with Namma Metro (Purple, Green, Yellow, and Pink lines).
- Covers all major tech parks and hubs: Manyata Tech Park, Bagmane Tech Park, Ecospace Bellandur, Electronic City, Whitefield ITPL, MG Road, Koramangala, Indiranagar, and Kempegowda International Airport (KIA).

10. GENERAL CONVERSATION & BROADER KNOWLEDGE:
- You have complete general knowledge and can answer questions on any topic: science, math, technology, general facts, coding, culture, or daily life.
- Always maintain a polite, witty, confident, and articulate persona.
- Use clean Markdown with bolding, bullet points, and code formatting where helpful.
- Support inquiries in English, Kannada, Hindi, and other languages naturally.`;

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
        maxOutputTokens: 1200,
      },
    };

    let res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    });

    let data = await res.json();

    // Auto-retry once on temporary 503 spike or rate limit
    if ((!res.ok || data.error) && (res.status === 503 || res.status === 429 || data.error?.code === 503)) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload),
      });
      data = await res.json();
    }

    if (!res.ok || data.error) {
      const errorDetail = data.error?.message || "Failed to generate AI response";
      // Graceful fallback response
      return apiSuccess({
        reply: `Hello! I am your Go-Fair AI assistant. You can choose between **Cab** (up to 4 members) and **Bike** (1 rider, ₹25 base + ₹8/km). Let me know your pickup and destination in Bengaluru and I'll help you pick the best route! (${errorDetail})`,
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

