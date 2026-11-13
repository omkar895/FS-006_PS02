import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/auth/admin";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export const runtime = "nodejs";

const TelemetrySchema = z.object({
  driverId: z.string().uuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = TelemetrySchema.safeParse(body);

    if (!parsed.success) {
      return apiError("INVALID_TELEMETRY", "Valid driverId, lat, and lng are required", 400);
    }

    const admin = createAdminClient();
    const { data: updated, error } = await admin
      .from("driver_profiles")
      .update({
        current_lat: parsed.data.lat,
        current_lng: parsed.data.lng,
        location_recorded_at: new Date().toISOString(),
        location_source: "live_gps",
      })
      .eq("user_id", parsed.data.driverId)
      .select("user_id, current_lat, current_lng, location_source, location_recorded_at")
      .single();

    if (error) {
      return apiError("DATABASE_ERROR", error.message, 500);
    }

    return apiSuccess({
      driverId: updated.user_id,
      lat: updated.current_lat,
      lng: updated.current_lng,
      source: updated.location_source,
      recordedAt: updated.location_recorded_at,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record telemetry";
    return apiError("TELEMETRY_FAILED", message, 500);
  }
}

