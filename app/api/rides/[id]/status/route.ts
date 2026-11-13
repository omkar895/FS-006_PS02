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
    const session = await requireRole(["driver", "admin"]);
    const { id: rideId } = await params;
    const body = await req.json();
    const parsed = StatusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid nextStatus parameter", 400);
    }

    const updatedRide = await RideService.updateStatus(
      rideId,
      session.userId,
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
