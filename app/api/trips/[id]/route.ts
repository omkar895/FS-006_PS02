import { NextRequest } from "next/server";
import { RideService } from "@/lib/services/ride-service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;
    const publicRide = await RideService.getPublicRide(tripId);

    if (!publicRide) {
      // Deterministic demo fallback if user tests arbitrary or mock IDs
      if (tripId.startsWith("demo") || tripId.includes("test")) {
        return apiSuccess({
          id: tripId,
          status: "ongoing",
          pickup_label: "Central Railway Station Hub (City Railway Hub)",
          pickup_lat: 12.9784,
          pickup_lng: 77.5683,
          destination_label: "Downtown Commercial Center (Financial District)",
          destination_lat: 12.9716,
          destination_lng: 77.5946,
          distance_km: 2.95,
          fare_estimate: 94.25,
          created_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          driver: {
            vehicle_label: "Toyota Innova (KA-01-EQ-4491)",
            vehicle_type: "sedan",
            current_lat: 12.975,
            current_lng: 77.581,
            rating: 4.92,
          },
        });
      }
      return apiError("NOT_FOUND", "Trip not found or expired", 404);
    }

    return apiSuccess(publicRide);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
