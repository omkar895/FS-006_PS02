import { createServerSupabaseClient } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/auth/admin";
import { Ride, RideStatus } from "@/lib/schemas/database";
import { isValidRideTransition } from "@/lib/algorithms/state-machine";
import { calculateHaversineDistanceKm, calculateFareEstimate } from "@/lib/algorithms/pricing";

export interface CreateRideInput {
  passengerId: string;
  pickupLabel: string;
  pickupLat: number;
  pickupLng: number;
  destinationLabel: string;
  destinationLat: number;
  destinationLng: number;
  idempotencyKey?: string;
}

export class RideService {
  /**
   * Passenger creates a new ride request with server-calculated distance and upfront estimate.
   */
  static async createRide(input: CreateRideInput): Promise<Ride> {
    const supabase = await createServerSupabaseClient();

    // Check idempotency if key provided
    if (input.idempotencyKey) {
      const { data: existing } = await supabase
        .from("rides")
        .select("*")
        .eq("passenger_id", input.passengerId)
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();

      if (existing) {
        return existing as Ride;
      }
    }

    const distanceKm = calculateHaversineDistanceKm(
      input.pickupLat,
      input.pickupLng,
      input.destinationLat,
      input.destinationLng
    );

    const pricing = calculateFareEstimate(distanceKm);

    // Auto-discover an available nearby driver if one is ready
    const admin = createAdminClient();
    const { data: availableDrivers } = await admin
      .from("driver_profiles")
      .select("user_id, current_lat, current_lng")
      .eq("availability", "available")
      .limit(1);

    const assignedDriverId = availableDrivers && availableDrivers.length > 0
      ? availableDrivers[0].user_id
      : null;

    const newRideData = {
      passenger_id: input.passengerId,
      assigned_driver_id: assignedDriverId,
      pickup_label: input.pickupLabel,
      pickup_lat: input.pickupLat,
      pickup_lng: input.pickupLng,
      destination_label: input.destinationLabel,
      destination_lat: input.destinationLat,
      destination_lng: input.destinationLng,
      status: "requested",
      distance_km: distanceKm,
      pickup_eta_minutes: assignedDriverId ? 6.0 : null,
      trip_eta_minutes: pricing.tripEtaMinutes,
      base_fare: pricing.baseFare,
      distance_fare: pricing.distanceFare,
      surge_multiplier: pricing.surgeMultiplier,
      fare_estimate: pricing.fareEstimate,
      idempotency_key: input.idempotencyKey || null,
      match_metadata: {
        engine: "FairRide Matching v1",
        method: "Initial request dispatch",
      },
    };

    const { data: createdRide, error: insertError } = await admin
      .from("rides")
      .insert(newRideData)
      .select("*")
      .single();

    if (insertError || !createdRide) {
      throw new Error(`Failed to create ride: ${insertError?.message || "Unknown error"}`);
    }

    // Append-only audit event
    await admin.from("ride_events").insert({
      ride_id: createdRide.id,
      event_type: "RIDE_REQUESTED",
      from_status: null,
      to_status: "requested",
      actor_id: input.passengerId,
      actor_role: "passenger",
      description: "Ride request initiated by passenger",
      payload: { distanceKm, fareEstimate: pricing.fareEstimate, assignedDriverId },
    });

    return createdRide as Ride;
  }

  /**
   * Driver responds to ride offer (accept / reject).
   */
  static async respondToOffer(
    rideId: string,
    driverId: string,
    decision: "accept" | "reject",
    reasonCode?: string
  ): Promise<Ride> {
    const admin = createAdminClient();

    const { data: ride, error: fetchError } = await admin
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single();

    if (fetchError || !ride) {
      throw new Error("RIDE_NOT_FOUND");
    }

    if (ride.assigned_driver_id !== driverId) {
      throw new Error("DRIVER_NOT_ASSIGNED");
    }

    if (ride.status !== "requested") {
      throw new Error("RIDE_STATE_CONFLICT");
    }

    if (decision === "accept") {
      // Transition to accepted and mark driver as busy
      const transitionCheck = isValidRideTransition("requested", "accepted", "driver");
      if (!transitionCheck.valid) {
        throw new Error(transitionCheck.error);
      }

      const { data: updatedRide, error: updateError } = await admin
        .from("rides")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", rideId)
        .eq("status", "requested") // Optimistic concurrency check
        .select("*")
        .single();

      if (updateError || !updatedRide) {
        throw new Error("RIDE_ALREADY_ASSIGNED");
      }

      await admin
        .from("driver_profiles")
        .update({ availability: "busy" })
        .eq("user_id", driverId);

      await admin.from("ride_events").insert({
        ride_id: rideId,
        event_type: "RIDE_ACCEPTED",
        from_status: "requested",
        to_status: "accepted",
        actor_id: driverId,
        actor_role: "driver",
        description: "Assigned driver accepted ride offer",
      });

      return updatedRide as Ride;
    } else {
      // Reject: trigger reassigning state
      const { data: updatedRide } = await admin
        .from("rides")
        .update({
          status: "reassigning",
          assigned_driver_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rideId)
        .select("*")
        .single();

      await admin.from("ride_events").insert({
        ride_id: rideId,
        event_type: "RIDE_REJECTED",
        from_status: "requested",
        to_status: "reassigning",
        actor_id: driverId,
        actor_role: "driver",
        description: `Driver rejected ride offer: ${reasonCode || "UNAVAILABLE"}`,
      });

      return updatedRide as Ride;
    }
  }

  /**
   * Driver updates active trip status: accepted -> arriving -> ongoing -> completed.
   */
  static async updateStatus(
    rideId: string,
    driverId: string,
    nextStatus: RideStatus
  ): Promise<Ride> {
    const admin = createAdminClient();

    const { data: ride, error: fetchError } = await admin
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single();

    if (fetchError || !ride) {
      throw new Error("RIDE_NOT_FOUND");
    }

    if (ride.assigned_driver_id !== driverId) {
      throw new Error("DRIVER_NOT_ASSIGNED");
    }

    const check = isValidRideTransition(ride.status as RideStatus, nextStatus, "driver");
    if (!check.valid) {
      throw new Error(check.error || "INVALID_TRANSITION");
    }

    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status: nextStatus,
      updated_at: now,
    };

    if (nextStatus === "arriving") updatePayload.arriving_at = now;
    if (nextStatus === "ongoing") updatePayload.started_at = now;
    if (nextStatus === "completed") {
      updatePayload.completed_at = now;
      updatePayload.fare_final = ride.fare_estimate;
    }

    const { data: updatedRide, error: updateError } = await admin
      .from("rides")
      .update(updatePayload)
      .eq("id", rideId)
      .eq("status", ride.status) // Optimistic state lock
      .select("*")
      .single();

    if (updateError || !updatedRide) {
      throw new Error("RIDE_STATE_CONFLICT");
    }

    // If completed, release driver to available
    if (nextStatus === "completed") {
      await admin
        .from("driver_profiles")
        .update({
          availability: "available",
        })
        .eq("user_id", driverId);
    }

    await admin.from("ride_events").insert({
      ride_id: rideId,
      event_type: `RIDE_${nextStatus.toUpperCase()}`,
      from_status: ride.status,
      to_status: nextStatus,
      actor_id: driverId,
      actor_role: "driver",
      description: `Ride progressed to ${nextStatus}`,
    });

    return updatedRide as Ride;
  }
}
