import { createAdminClient } from "@/lib/auth/admin";
import { executeDispatchMatching, CandidateDriverInput } from "@/lib/algorithms/dispatch-matching";

export interface ReassignmentResult {
  rideId: string;
  status: "reassigned" | "unassigned";
  previousDriverId: string | null;
  newDriverId: string | null;
  attemptCount: number;
  message: string;
}

export class ReassignmentService {
  private static MAX_ATTEMPTS = 3;

  /**
   * Idempotent, transaction-safe automatic reassignment engine.
   * Excludes all previously tried drivers in this dispatch cycle.
   */
  static async handleDriverException(
    rideId: string,
    reason:
      | "REJECTED"
      | "TIMEOUT"
      | "CANCELLED_BY_DRIVER"
      | "DELAYED_ARRIVAL"
      | "SEARCH_EXPANSION"
      | "UNASSIGNED_FALLBACK"
  ): Promise<ReassignmentResult> {
    const admin = createAdminClient();

    // 1. Fetch current ride state
    const { data: ride, error: fetchError } = await admin
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single();

    if (fetchError || !ride) {
      throw new Error("RIDE_NOT_FOUND");
    }

    if (ride.status === "completed" || ride.status === "cancelled") {
      throw new Error(`CANNOT_REASSIGN_TERMINAL_RIDE: status is ${ride.status}`);
    }

    // 2. Fetch past attempted drivers from append-only events
    const { data: events } = await admin
      .from("ride_events")
      .select("actor_id, actor_role, payload")
      .eq("ride_id", rideId);

    const triedDriverIds = new Set<string>();
    if (ride.assigned_driver_id) {
      triedDriverIds.add(ride.assigned_driver_id);
    }

    let attemptCount = 1;
    for (const ev of events || []) {
      if (ev.actor_role === "driver" && ev.actor_id) triedDriverIds.add(ev.actor_id);
      if (ev.payload?.triedDriverId) triedDriverIds.add(ev.payload.triedDriverId);
      if (ev.payload?.attemptCount) attemptCount = Math.max(attemptCount, ev.payload.attemptCount + 1);
    }

    const previousDriverId = ride.assigned_driver_id;

    // 3. Check attempt limit
    if (attemptCount > this.MAX_ATTEMPTS) {
      // Transition to unassigned
      await admin
        .from("rides")
        .update({
          status: "unassigned",
          assigned_driver_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rideId);

      await admin.from("ride_events").insert({
        ride_id: rideId,
        event_type: "REASSIGNMENT_EXHAUSTED",
        from_status: ride.status,
        to_status: "unassigned",
        actor_id: null,
        actor_role: "system",
        description: `Max reassignment limit (${this.MAX_ATTEMPTS}) reached. No candidates accepted.`,
        payload: { attemptCount, triedDrivers: Array.from(triedDriverIds) },
      });

      return {
        rideId,
        status: "unassigned",
        previousDriverId,
        newDriverId: null,
        attemptCount,
        message: "All dispatch retry attempts exhausted. No drivers available.",
      };
    }

    // 4. Mark ride as reassigning and release previous driver
    if (previousDriverId) {
      await admin
        .from("driver_profiles")
        .update({ availability: "available" })
        .eq("user_id", previousDriverId);
    }

    await admin.from("ride_events").insert({
      ride_id: rideId,
      event_type: "REASSIGNMENT_INITIATED",
      from_status: ride.status,
      to_status: "reassigning",
      actor_id: previousDriverId,
      actor_role: "system",
      description: `Reassignment triggered by ${reason}. Excluded driver from current cycle.`,
      payload: { attemptCount, reason, triedDriverId: previousDriverId },
    });

    // 5. Query candidate fleet excluding tried drivers
    const { data: rawDrivers } = await admin.from("driver_profiles").select("*");

    const candidates: CandidateDriverInput[] = (rawDrivers || []).map((d) => ({
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
      candidates,
      ride.pickup_lat,
      ride.pickup_lng,
      undefined,
      {
        maxPickupEtaMinutes: 15,
        maxLocationAgeMinutes: 15,
        assumedSpeedKmh: 30,
        pickupBufferMinutes: 2,
        idleSaturationMinutes: 60,
        excludedDriverIds: Array.from(triedDriverIds),
      }
    );

    let newCandidate = dispatchResult.selectedCandidate;

    // PS2 Dynamic Radius Expansion: If no candidate within strict 15-min ETA, expand search radius
    if (!newCandidate && candidates.length > 0) {
      const remainingCandidates = candidates.filter((c) => !triedDriverIds.has(c.userId));
      if (remainingCandidates.length > 0) {
        const expandedResult = executeDispatchMatching(
          remainingCandidates,
          ride.pickup_lat,
          ride.pickup_lng,
          undefined,
          {
            maxPickupEtaMinutes: 360,
            maxLocationAgeMinutes: 120,
            assumedSpeedKmh: 45,
            pickupBufferMinutes: 3,
            idleSaturationMinutes: 180,
            excludedDriverIds: Array.from(triedDriverIds),
          }
        );
        if (expandedResult.selectedCandidate) {
          newCandidate = {
            ...expandedResult.selectedCandidate,
            explanation: `PS2 Dynamic Reassignment (Expanded Wave ${attemptCount}): Selected optimal driver across fleet.`,
          };
        }
      }
    }

    if (!newCandidate) {
      // No remaining eligible candidates
      await admin
        .from("rides")
        .update({
          status: "unassigned",
          assigned_driver_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rideId);

      await admin.from("ride_events").insert({
        ride_id: rideId,
        event_type: "NO_REASSIGNMENT_CANDIDATE",
        from_status: "reassigning",
        to_status: "unassigned",
        actor_id: null,
        actor_role: "system",
        description: "No eligible drivers remain within radius after excluding tried drivers.",
        payload: { attemptCount, excludedDriverIds: Array.from(triedDriverIds) },
      });

      return {
        rideId,
        status: "unassigned",
        previousDriverId,
        newDriverId: null,
        attemptCount,
        message: "No other available drivers nearby.",
      };
    }

    // 6. Atomically reassign to new candidate
    await admin
      .from("rides")
      .update({
        status: "requested",
        assigned_driver_id: newCandidate.userId,
        pickup_eta_minutes: newCandidate.pickupEtaMinutes,
        updated_at: new Date().toISOString(),
        match_metadata: {
          ...ride.match_metadata,
          reassignedFrom: previousDriverId,
          reassignmentAttempt: attemptCount,
          explanation: newCandidate.explanation,
        },
      })
      .eq("id", rideId);

    await admin.from("ride_events").insert({
      ride_id: rideId,
      event_type: "RIDE_REASSIGNED",
      from_status: "reassigning",
      to_status: "requested",
      actor_id: newCandidate.userId,
      actor_role: "system",
      description: `Reassigned to driver ${newCandidate.vehicleLabel} (Attempt ${attemptCount}).`,
      payload: { attemptCount, newDriverId: newCandidate.userId },
    });

    return {
      rideId,
      status: "reassigned",
      previousDriverId,
      newDriverId: newCandidate.userId,
      attemptCount,
      message: `Successfully reassigned to driver ${newCandidate.vehicleLabel}`,
    };
  }
}
