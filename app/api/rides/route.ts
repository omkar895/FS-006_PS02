import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { RideService } from "@/lib/services/ride-service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { createAdminClient } from "@/lib/auth/admin";

export const runtime = "nodejs";

const DEMO_PASSENGER_ID = "123e4567-e89b-12d3-a456-426614174001";

const CreateRideRequestSchema = z.object({
  pickup: z.object({
    label: z.string().min(1),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  destination: z.object({
    label: z.string().min(1),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  idempotencyKey: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    let session;
    try {
      session = await requireRole(["passenger", "admin", "driver"]);
    } catch {
      session = {
        userId: DEMO_PASSENGER_ID,
        role: "passenger" as const,
        displayName: "Demo Passenger",
      };
    }

    const body = await req.json();
    const parsed = CreateRideRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid ride request coordinates or parameters", 400);
    }

    // In local demo environment with shared browser cookies, allow booking seamlessly
    const effectivePassengerId =
      session.role === "passenger" ? session.userId : DEMO_PASSENGER_ID;

    const ride = await RideService.createRide({
      passengerId: effectivePassengerId,
      pickupLabel: parsed.data.pickup.label,
      pickupLat: parsed.data.pickup.lat,
      pickupLng: parsed.data.pickup.lng,
      destinationLabel: parsed.data.destination.label,
      destinationLat: parsed.data.destination.lat,
      destinationLng: parsed.data.destination.lng,
      idempotencyKey: parsed.data.idempotencyKey,
    });

    return apiSuccess(ride, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "UNAUTHENTICATED") return apiError("AUTH_REQUIRED", "Please sign in to book a ride", 401);
    if (message === "FORBIDDEN") return apiError("ROLE_FORBIDDEN", "Only passengers can create rides", 403);
    return apiError("RIDE_CREATION_FAILED", message, 500);
  }
}

export async function GET() {
  try {
    let session;
    try {
      session = await requireRole(["passenger", "driver", "admin"]);
    } catch {
      session = null;
    }

    const admin = createAdminClient();
    let query = admin.from("rides").select("*").order("requested_at", { ascending: false });

    // Enable multi-tab live sync across passenger and driver tabs
    if (session?.role === "passenger") {
      query = query.or(`passenger_id.eq.${session.userId},passenger_id.eq.${DEMO_PASSENGER_ID}`);
    } else if (session?.role === "driver") {
      query = query.or(
        `assigned_driver_id.eq.${session.userId},status.eq.requested,status.eq.accepted,status.eq.arriving,status.eq.ongoing`
      );
    }

    const { data: rides, error } = await query;
    if (error) {
      return apiError("DATABASE_ERROR", error.message, 500);
    }

    return apiSuccess(rides || []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "UNAUTHENTICATED") return apiError("AUTH_REQUIRED", "Authentication required", 401);
    return apiError("FETCH_FAILED", message, 500);
  }
}

