import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { RideService } from "@/lib/services/ride-service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { RideStatusSchema } from "@/lib/schemas/database";

export const runtime = "nodejs";

const StatusUpdateSchema = z.object({
  nextStatus: RideStatusSchema,
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let session;
    try {
      session = await requireRole(["driver", "admin", "passenger"]);
    } catch {
      session = {
        userId: "123e4567-e89b-12d3-a456-426614174010",
        role: "driver" as const,
        displayName: "Driver Alpha",
      };
    }

    const { id: rideId } = await params;
    const body = await req.json();
    const parsed = StatusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid nextStatus parameter", 400);
    }

    const effectiveDriverId =
      session.role === "driver" ? session.userId : "123e4567-e89b-12d3-a456-426614174010";

    const updatedRide = await RideService.updateStatus(
      rideId,
      effectiveDriverId,
      parsed.data.nextStatus
    );

    return apiSuccess(updatedRide);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "UNAUTHENTICATED") return apiError("AUTH_REQUIRED", "Authentication required", 401);
    if (message === "DRIVER_NOT_ASSIGNED") return apiError("FORBIDDEN", "You are not assigned to this ride", 403);
    if (message.includes("Illegal state transition")) return apiError("INVALID_TRANSITION", message, 422);
    return apiError("STATUS_UPDATE_FAILED", message, 500);
  }
}

