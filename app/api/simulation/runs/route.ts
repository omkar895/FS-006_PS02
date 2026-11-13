import { NextRequest } from "next/server";
import { z } from "zod";
import { runSimulationLab, SimulationScenarioConfig } from "@/lib/algorithms/simulation-lab";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export const runtime = "nodejs";

const SimulationRequestSchema = z.object({
  scenario: z.enum(["balanced", "high_demand", "low_supply"]).default("balanced"),
  requestCount: z.number().int().min(10).max(200).default(50),
  driverCount: z.number().int().min(3).max(50).default(10),
  seed: z.number().int().default(42),
  maxPickupEtaMinutes: z.number().positive().default(15),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = SimulationRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("INVALID_PARAMETERS", "Invalid simulation configuration", 400);
    }

    const config: SimulationScenarioConfig = parsed.data;
    const result = runSimulationLab(config);

    return apiSuccess(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Simulation execution failed";
    return apiError("SIMULATION_FAILED", message, 500);
  }
}

