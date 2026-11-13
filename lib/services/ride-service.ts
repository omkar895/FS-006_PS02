import { createServerSupabaseClient } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/auth/admin";
import { Ride, RideStatus } from "@/lib/schemas/database";
import { isValidRideTransition } from "@/lib/algorithms/state-machine";
import { calculateHaversineDistanceKm, calculateFareEstimate } from "@/lib/algorithms/pricing";
import { executeDispatchMatching, CandidateDriverInput } from "@/lib/algorithms/dispatch-matching";

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

    // Execute fairness-aware dispatch matching over available fleet
    const admin = createAdminClient();
    const { data: rawDrivers } = await admin
      .from("driver_profiles")
      .select("*");

    const candidateInputs: CandidateDriverInput[] = (rawDrivers || []).map((d) => ({
      userId: d.user_id,
      vehicleLabel: d.vehicle_label,
      vehicleType: d.vehicle_type,
      lat: d.current_lat ?? 0,
      lng: d.current_lng ?? 0,
      availability: d.availability as "available" | "busy" | "offline",
      locationRecordedAt: d.location_recorded_at,
      activeRidesCount: 0,
      completedRidesToday: d.completed_rides ?? 0,
      acceptedCount: d.accepted_count ?? 0,
      offeredCount: d.offered_count ?? 0,
      idleMinutes: d.idle_since
        ? Math.round((Date.now() - new Date(d.idle_since).getTime()) / (1000 * 60))
        : 15,
    }));

    const dispatchResult = executeDispatchMatching(
      candidateInputs,
      input.pickupLat,
      input.pickupLng
    );

    const assignedCandidate = dispatchResult.selectedCandidate;
    const assignedDriverId = assignedCandidate ? assignedCandidate.userId : null;

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
      pickup_eta_minutes: assignedCandidate ? assignedCandidate.pickupEtaMinutes : null,
      trip_eta_minutes: pricing.tripEtaMinutes,
      base_fare: pricing.baseFare,
      distance_fare: pricing.distanceFare,
      surge_multiplier: pricing.surgeMultiplier,
      fare_estimate: pricing.fareEstimate,
      idempotency_key: input.idempotencyKey || null,
      match_metadata: {
        engine: "FairRide Dispatch Engine v1",
        method: dispatchResult.method,
        score: assignedCandidate?.totalScore ?? null,
        scoreContributions: assignedCandidate?.scoreContributions ?? null,
        explanation: assignedCandidate?.explanation ?? "No driver immediately available within service threshold",
        baselineMatch: dispatchResult.baselineCandidate?.userId ?? null,
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

    // In local demo prototype, allow active driver terminal (Driver Alpha / Beta) or assigned candidate to accept
    const isAssigned = !ride.assigned_driver_id || ride.assigned_driver_id === driverId;
    const isDemoDriver =
      driverId === "123e4567-e89b-12d3-a456-426614174010" ||
      driverId === "123e4567-e89b-12d3-a456-426614174011" ||
      driverId === "123e4567-e89b-12d3-a456-426614174012";

    if (!isAssigned && !isDemoDriver) {
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
          assigned_driver_id: driverId,
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

      // Automatically trigger idempotent, bounded reassignment to the next candidate
      try {
        const { ReassignmentService } = await import("@/lib/services/reassignment-service");
        await ReassignmentService.handleDriverException(rideId, "REJECTED");
      } catch {
        // Handled gracefully if retry limit reached
      }

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

    // In local demo prototype, allow active driver terminal (Driver Alpha / Beta) or assigned candidate
    const isAssigned = !ride.assigned_driver_id || ride.assigned_driver_id === driverId;
    const isDemoDriver =
      driverId === "123e4567-e89b-12d3-a456-426614174010" ||
      driverId === "123e4567-e89b-12d3-a456-426614174011" ||
      driverId === "123e4567-e89b-12d3-a456-426614174012";

    if (!isAssigned && !isDemoDriver) {
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

  /**
   * Public, unauthenticated read-only trip tracking for /trip/[id]
   * Strips sensitive rider/driver personal PII, provides road progress and vehicle details.
   */
  static async getPublicRide(rideId: string) {
    const admin = createAdminClient();
    const { data: ride, error } = await admin
      .from("rides")
      .select("id, status, pickup_label, pickup_lat, pickup_lng, destination_label, destination_lat, destination_lng, distance_km, fare_estimate, requested_at, created_at, started_at, completed_at, assigned_driver_id, match_metadata")
      .eq("id", rideId)
      .maybeSingle();

    if (error || !ride) {
      return null;
    }

    let driverInfo = null;
    if (ride.assigned_driver_id) {
      const { data: driver } = await admin
        .from("driver_profiles")
        .select("vehicle_label, vehicle_type, current_lat, current_lng, rating")
        .eq("user_id", ride.assigned_driver_id)
        .maybeSingle();
      if (driver) {
        driverInfo = driver;
      }
    }

    return {
      ...ride,
      driver: driverInfo,
    };
  }
}
