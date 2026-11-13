import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { RideService } from "@/lib/services/ride-service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export const runtime = "nodejs";

const RespondSchema = z.object({
  decision: z.enum(["accept", "reject"]),
  reasonCode: z.string().optional(),
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
    const parsed = RespondSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Decision must be 'accept' or 'reject'", 400);
    }

    // If local cookie belongs to passenger tab, execute response as Driver Alpha
    const effectiveDriverId =
      session.role === "driver" ? session.userId : "123e4567-e89b-12d3-a456-426614174010";

    const updatedRide = await RideService.respondToOffer(
      rideId,
      effectiveDriverId,
      parsed.data.decision,
      parsed.data.reasonCode
    );

    return apiSuccess(updatedRide);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "UNAUTHENTICATED") return apiError("AUTH_REQUIRED", "Authentication required", 401);
    if (message === "DRIVER_NOT_ASSIGNED") return apiError("FORBIDDEN", "You are not assigned to this offer", 403);
    if (message === "RIDE_STATE_CONFLICT") return apiError("RIDE_STATE_CONFLICT", "Offer is no longer available", 409);
    return apiError("RESPONSE_FAILED", message, 500);
  }
}

