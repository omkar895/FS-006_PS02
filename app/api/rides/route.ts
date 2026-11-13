import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { RideService } from "@/lib/services/ride-service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { createServerSupabaseClient } from "@/lib/auth/server";

export const runtime = "nodejs";

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
    const session = await requireRole(["passenger", "admin"]);
    const body = await req.json();
    const parsed = CreateRideRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid ride request coordinates or parameters", 400);
    }

    const ride = await RideService.createRide({
      passengerId: session.userId,
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
    const session = await requireRole(["passenger", "driver", "admin"]);
    const supabase = await createServerSupabaseClient();

    let query = supabase.from("rides").select("*").order("requested_at", { ascending: false });

    if (session.role === "passenger") {
      query = query.eq("passenger_id", session.userId);
    } else if (session.role === "driver") {
      query = query.eq("assigned_driver_id", session.userId);
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

