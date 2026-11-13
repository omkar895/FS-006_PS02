import { NextRequest } from "next/server";
import { z } from "zod";
import { ReassignmentService } from "@/lib/services/reassignment-service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export const runtime = "nodejs";

const ReassignSchema = z.object({
  reason: z.enum(["REJECTED", "TIMEOUT", "CANCELLED_BY_DRIVER", "DELAYED_ARRIVAL"]).default("REJECTED"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rideId } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = ReassignSchema.safeParse(body);

    const reason = parsed.success ? parsed.data.reason : "REJECTED";

    const result = await ReassignmentService.handleDriverException(rideId, reason);
    return apiSuccess(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Reassignment failed";
    return apiError("REASSIGNMENT_FAILED", message, 500);
  }
}

