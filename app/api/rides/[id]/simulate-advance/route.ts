import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/auth/admin";
import { RideService } from "@/lib/services/ride-service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rideId } = await params;
    const admin = createAdminClient();

    const { data: ride, error: fetchError } = await admin
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single();

    if (fetchError || !ride) {
      return apiError("RIDE_NOT_FOUND", "Active ride not found", 404);
    }

    if (!ride.assigned_driver_id) {
      return apiError("NO_DRIVER", "No driver assigned to this ride", 400);
    }

    let updatedRide;

    switch (ride.status) {
      case "requested":
        updatedRide = await RideService.respondToOffer(
          ride.id,
          ride.assigned_driver_id,
          "accept"
        );
        break;

      case "accepted":
        updatedRide = await RideService.updateStatus(
          ride.id,
          ride.assigned_driver_id,
          "arriving"
        );
        break;

      case "arriving":
        updatedRide = await RideService.updateStatus(
          ride.id,
          ride.assigned_driver_id,
          "ongoing"
        );
        break;

      case "ongoing":
        updatedRide = await RideService.updateStatus(
          ride.id,
          ride.assigned_driver_id,
          "completed"
        );
        break;

      default:
        return apiError(
          "INVALID_STATE",
          `Cannot simulate advance from terminal status: ${ride.status}`,
          400
        );
    }

    return apiSuccess(updatedRide);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Simulation step failed";
    return apiError("SIMULATION_STEP_FAILED", message, 500);
  }
}
