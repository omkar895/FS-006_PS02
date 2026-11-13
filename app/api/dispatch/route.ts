import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/auth/admin";
import { executeDispatchMatching, CandidateDriverInput } from "@/lib/algorithms/dispatch-matching";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export const runtime = "nodejs";

const DispatchTestQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  maxPickupEtaMinutes: z.coerce.number().positive().default(15),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = DispatchTestQuerySchema.safeParse({
      lat: searchParams.get("lat"),
      lng: searchParams.get("lng"),
      maxPickupEtaMinutes: searchParams.get("maxPickupEtaMinutes") || 15,
    });

    if (!parsed.success) {
      return apiError("INVALID_PARAMETERS", "Valid latitude and longitude required", 400);
    }

    const admin = createAdminClient();
    const { data: drivers, error } = await admin
      .from("driver_profiles")
      .select("*");

    if (error) {
      return apiError("DATABASE_ERROR", error.message, 500);
    }

    const candidates: CandidateDriverInput[] = (drivers || []).map((d) => ({
      userId: d.user_id,
      vehicleLabel: d.vehicle_label,
      vehicleType: d.vehicle_type,
      lat: d.current_lat ?? 0,
      lng: d.current_lng ?? 0,
      availability: d.availability as "available" | "busy" | "offline",
      locationRecordedAt: d.location_recorded_at,
      activeRidesCount: 0,
      completedRidesToday: d.completed_rides ?? 0,
      acceptedCount: d.accepted_count ?? 0,
      offeredCount: d.offered_count ?? 0,
      idleMinutes: d.idle_since
        ? Math.round((Date.now() - new Date(d.idle_since).getTime()) / (1000 * 60))
        : 10,
    }));

    const decision = executeDispatchMatching(
      candidates,
      parsed.data.lat,
      parsed.data.lng,
      undefined,
      {
        maxPickupEtaMinutes: parsed.data.maxPickupEtaMinutes,
        maxLocationAgeMinutes: 15,
        assumedSpeedKmh: 30,
        pickupBufferMinutes: 2,
        idleSaturationMinutes: 60,
      }
    );

    return apiSuccess(decision);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Dispatch matching error";
    return apiError("DISPATCH_FAILED", message, 500);
  }
}
