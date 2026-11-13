import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/auth/admin";
import { filterAndProjectNearbyDrivers } from "@/lib/services/driver-discovery";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export const runtime = "nodejs";

const NearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  maxAgeMinutes: z.coerce.number().positive().default(15),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = NearbyQuerySchema.safeParse({
      lat: searchParams.get("lat"),
      lng: searchParams.get("lng"),
      maxAgeMinutes: searchParams.get("maxAgeMinutes") || 15,
    });

    if (!parsed.success) {
      return apiError(
        "INVALID_COORDINATES",
        "Valid latitude and longitude search query parameters are required",
        400
      );
    }

    const admin = createAdminClient();
    const { data: drivers, error } = await admin
      .from("driver_profiles")
      .select("user_id, vehicle_label, vehicle_type, current_lat, current_lng, availability, location_source, location_recorded_at")
      .eq("availability", "available");

    if (error) {
      return apiError("DATABASE_ERROR", error.message, 500);
    }

    const nearby = filterAndProjectNearbyDrivers(
      drivers || [],
      parsed.data.lat,
      parsed.data.lng,
      parsed.data.maxAgeMinutes
    );

    return apiSuccess(nearby);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error querying nearby drivers";
    return apiError("DISCOVERY_FAILED", message, 500);
  }
}

