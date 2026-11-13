import { calculateHaversineDistanceKm } from "@/lib/algorithms/pricing";

export interface PoolPassengerRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  pickupLat: number;
  pickupLng: number;
  pickupLabel: string;
  destinationLat: number;
  destinationLng: number;
  destinationLabel: string;
  directDistanceKm: number;
  directEtaMinutes: number;
  directFare: number;
}

export type StopType = "pickup" | "dropoff";

export interface RouteStop {
  stopIndex: number;
  passengerId: string;
  passengerName: string;
  type: StopType;
  label: string;
  lat: number;
  lng: number;
}

export interface PooledRoutePlan {
  isCompatible: boolean;
  rejectionReason?: string;
  sequence: RouteStop[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  passengerA: {
    requestId: string;
    passengerName: string;
    directDistanceKm: number;
    pooledDistanceKm: number;
    detourRatio: number;
    directEtaMinutes: number;
    pooledEtaMinutes: number;
    addedMinutes: number;
    directFare: number;
    pooledFare: number;
    savingsAmount: number;
    savingsPercent: number;
  };
  passengerB: {
    requestId: string;
    passengerName: string;
    directDistanceKm: number;
    pooledDistanceKm: number;
    detourRatio: number;
    directEtaMinutes: number;
    pooledEtaMinutes: number;
    addedMinutes: number;
    directFare: number;
    pooledFare: number;
    savingsAmount: number;
    savingsPercent: number;
  };
  totalSharedFare: number;
  totalDirectFareSum: number;
}

export interface PoolingConstraints {
  maxPickupProximityKm: number; // default: 3.0 km
  maxDetourRatio: number; // default: 1.35
  maxAddedMinutes: number; // default: 10 mins
  assumedSpeedKmh: number; // default: 30 km/h
  poolDiscountRate: number; // default: 20% savings
}

export const DEFAULT_POOL_CONSTRAINTS: PoolingConstraints = {
  maxPickupProximityKm: 3.0,
  maxDetourRatio: 1.35,
  maxAddedMinutes: 10,
  assumedSpeedKmh: 30,
  poolDiscountRate: 0.20,
};

/**
 * Evaluates whether two passenger requests can be pooled and determines the optimal
 * feasible stop sequence (satisfying pickup-before-dropoff constraints).
 */
export function evaluateTwoPassengerPool(
  reqA: PoolPassengerRequest,
  reqB: PoolPassengerRequest,
  constraints: PoolingConstraints = DEFAULT_POOL_CONSTRAINTS
): PooledRoutePlan {
  // 1. Proximity check
  const pickupDistance = calculateHaversineDistanceKm(
    reqA.pickupLat,
    reqA.pickupLng,
    reqB.pickupLat,
    reqB.pickupLng
  );

  if (pickupDistance > constraints.maxPickupProximityKm) {
    return createIncompatiblePlan(
      `Pickups are ${pickupDistance} km apart, exceeding ${constraints.maxPickupProximityKm} km pooling threshold.`
    );
  }

  // Define the 4 stops
  const P_A: RouteStop = { stopIndex: 0, passengerId: reqA.id, passengerName: reqA.passengerName, type: "pickup", label: reqA.pickupLabel, lat: reqA.pickupLat, lng: reqA.pickupLng };
  const D_A: RouteStop = { stopIndex: 0, passengerId: reqA.id, passengerName: reqA.passengerName, type: "dropoff", label: reqA.destinationLabel, lat: reqA.destinationLat, lng: reqA.destinationLng };
  const P_B: RouteStop = { stopIndex: 0, passengerId: reqB.id, passengerName: reqB.passengerName, type: "pickup", label: reqB.pickupLabel, lat: reqB.pickupLat, lng: reqB.pickupLng };
  const D_B: RouteStop = { stopIndex: 0, passengerId: reqB.id, passengerName: reqB.passengerName, type: "dropoff", label: reqB.destinationLabel, lat: reqB.destinationLat, lng: reqB.destinationLng };

  // The only 4 valid pickup-before-dropoff permutations for two passengers:
  // 1. P_A -> P_B -> D_A -> D_B (A dropped first)
  // 2. P_A -> P_B -> D_B -> D_A (B dropped first)
  // 3. P_B -> P_A -> P_B? (No, B pickup first):
  //    P_B -> P_A -> D_B -> D_A (B dropped first)
  // 4. P_B -> P_A -> D_A -> D_B (A dropped first)
  const candidateSequences = [
    [P_A, P_B, D_A, D_B],
    [P_A, P_B, D_B, D_A],
    [P_B, P_A, D_B, D_A],
    [P_B, P_A, D_A, D_B],
  ];

  let bestPlan: PooledRoutePlan | null = null;
  let lowestTotalDistance = Infinity;

  for (const seq of candidateSequences) {
    // Calculate segmented distances
    const d01 = calculateHaversineDistanceKm(seq[0].lat, seq[0].lng, seq[1].lat, seq[1].lng);
    const d12 = calculateHaversineDistanceKm(seq[1].lat, seq[1].lng, seq[2].lat, seq[2].lng);
    const d23 = calculateHaversineDistanceKm(seq[2].lat, seq[2].lng, seq[3].lat, seq[3].lng);
    const totalDist = Math.round((d01 + d12 + d23) * 100) / 100;

    // Calculate passenger A path
    let distA = 0;
    if (seq[0].passengerId === reqA.id && seq[2].passengerId === reqA.id) distA = d01 + d12;
    else if (seq[0].passengerId === reqA.id && seq[3].passengerId === reqA.id) distA = d01 + d12 + d23;
    else if (seq[1].passengerId === reqA.id && seq[2].passengerId === reqA.id) distA = d12;
    else if (seq[1].passengerId === reqA.id && seq[3].passengerId === reqA.id) distA = d12 + d23;

    // Calculate passenger B path
    let distB = 0;
    if (seq[0].passengerId === reqB.id && seq[2].passengerId === reqB.id) distB = d01 + d12;
    else if (seq[0].passengerId === reqB.id && seq[3].passengerId === reqB.id) distB = d01 + d12 + d23;
    else if (seq[1].passengerId === reqB.id && seq[2].passengerId === reqB.id) distB = d12;
    else if (seq[1].passengerId === reqB.id && seq[3].passengerId === reqB.id) distB = d12 + d23;

    const detourRatioA = Math.round((distA / Math.max(0.1, reqA.directDistanceKm)) * 100) / 100;
    const detourRatioB = Math.round((distB / Math.max(0.1, reqB.directDistanceKm)) * 100) / 100;

    const etaA = Math.round((distA / constraints.assumedSpeedKmh) * 60);
    const etaB = Math.round((distB / constraints.assumedSpeedKmh) * 60);
    const addedA = Math.max(0, etaA - reqA.directEtaMinutes);
    const addedB = Math.max(0, etaB - reqB.directEtaMinutes);

    // Enforce detour & added time constraints
    if (detourRatioA > constraints.maxDetourRatio || detourRatioB > constraints.maxDetourRatio) continue;
    if (addedA > constraints.maxAddedMinutes || addedB > constraints.maxAddedMinutes) continue;

    if (totalDist < lowestTotalDistance) {
      lowestTotalDistance = totalDist;

      // Fare calculation: discount 20% on direct fare for both riders
      const pooledFareA = Math.round(reqA.directFare * (1 - constraints.poolDiscountRate));
      const pooledFareB = Math.round(reqB.directFare * (1 - constraints.poolDiscountRate));
      const sharedTotal = pooledFareA + pooledFareB;

      const orderedStops = seq.map((s, idx) => ({ ...s, stopIndex: idx + 1 }));

      bestPlan = {
        isCompatible: true,
        sequence: orderedStops,
        totalDistanceKm: totalDist,
        totalDurationMinutes: Math.round((totalDist / constraints.assumedSpeedKmh) * 60),
        passengerA: {
          requestId: reqA.id,
          passengerName: reqA.passengerName,
          directDistanceKm: reqA.directDistanceKm,
          pooledDistanceKm: distA,
          detourRatio: detourRatioA,
          directEtaMinutes: reqA.directEtaMinutes,
          pooledEtaMinutes: etaA,
          addedMinutes: addedA,
          directFare: reqA.directFare,
          pooledFare: pooledFareA,
          savingsAmount: reqA.directFare - pooledFareA,
          savingsPercent: Math.round(constraints.poolDiscountRate * 100),
        },
        passengerB: {
          requestId: reqB.id,
          passengerName: reqB.passengerName,
          directDistanceKm: reqB.directDistanceKm,
          pooledDistanceKm: distB,
          detourRatio: detourRatioB,
          directEtaMinutes: reqB.directEtaMinutes,
          pooledEtaMinutes: etaB,
          addedMinutes: addedB,
          directFare: reqB.directFare,
          pooledFare: pooledFareB,
          savingsAmount: reqB.directFare - pooledFareB,
          savingsPercent: Math.round(constraints.poolDiscountRate * 100),
        },
        totalSharedFare: sharedTotal,
        totalDirectFareSum: reqA.directFare + reqB.directFare,
      };
    }
  }

  if (!bestPlan) {
    return createIncompatiblePlan(
      `No feasible route satisfies detour limit (<=${constraints.maxDetourRatio}x) and extra time (<=${constraints.maxAddedMinutes}m).`
    );
  }

  return bestPlan;
}

function createIncompatiblePlan(reason: string): PooledRoutePlan {
  return {
    isCompatible: false,
    rejectionReason: reason,
    sequence: [],
    totalDistanceKm: 0,
    totalDurationMinutes: 0,
    passengerA: {
      requestId: "",
      passengerName: "",
      directDistanceKm: 0,
      pooledDistanceKm: 0,
      detourRatio: 1.0,
      directEtaMinutes: 0,
      pooledEtaMinutes: 0,
      addedMinutes: 0,
      directFare: 0,
      pooledFare: 0,
      savingsAmount: 0,
      savingsPercent: 0,
    },
    passengerB: {
      requestId: "",
      passengerName: "",
      directDistanceKm: 0,
      pooledDistanceKm: 0,
      detourRatio: 1.0,
      directEtaMinutes: 0,
      pooledEtaMinutes: 0,
      addedMinutes: 0,
      directFare: 0,
      pooledFare: 0,
      savingsAmount: 0,
      savingsPercent: 0,
    },
    totalSharedFare: 0,
    totalDirectFareSum: 0,
  };
}
