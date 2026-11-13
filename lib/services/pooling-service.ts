import { createAdminClient } from "@/lib/auth/admin";
import { evaluateTwoPassengerPool, PoolPassengerRequest, PooledRoutePlan } from "@/lib/algorithms/pooling";
import { calculateFareEstimate } from "@/lib/algorithms/pricing";

export class PoolingService {
  /**
   * Scans pending unassigned/requested passenger requests and identifies compatible 2-passenger pools.
   */
  static async discoverPoolingCandidates(): Promise<Array<{ requestA: PoolPassengerRequest; requestB: PoolPassengerRequest; plan: PooledRoutePlan }>> {
    const admin = createAdminClient();
    const { data: rides, error } = await admin
      .from("rides")
      .select("*")
      .eq("status", "requested");

    if (error || !rides || rides.length < 2) {
      return [];
    }

    const requests: PoolPassengerRequest[] = rides.map((r) => {
      const pricing = calculateFareEstimate(r.distance_km);
      return {
        id: r.id,
        passengerId: r.passenger_id,
        passengerName: `Passenger ${r.passenger_id.slice(0, 6)}`,
        pickupLat: r.pickup_lat,
        pickupLng: r.pickup_lng,
        pickupLabel: r.pickup_label,
        destinationLat: r.destination_lat,
        destinationLng: r.destination_lng,
        destinationLabel: r.destination_label,
        directDistanceKm: r.distance_km,
        directEtaMinutes: r.trip_eta_minutes || pricing.tripEtaMinutes,
        directFare: r.fare_estimate,
      };
    });

    const candidatePairs: Array<{ requestA: PoolPassengerRequest; requestB: PoolPassengerRequest; plan: PooledRoutePlan }> = [];

    for (let i = 0; i < requests.length; i++) {
      for (let j = i + 1; j < requests.length; j++) {
        const plan = evaluateTwoPassengerPool(requests[i], requests[j]);
        if (plan.isCompatible) {
          candidatePairs.push({
            requestA: requests[i],
            requestB: requests[j],
            plan,
          });
        }
      }
    }

    return candidatePairs;
  }
}

