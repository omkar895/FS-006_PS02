import { calculateHaversineDistanceKm } from "@/lib/algorithms/pricing";

export interface CandidateDriverInput {
  userId: string;
  vehicleLabel: string;
  vehicleType: string;
  lat: number;
  lng: number;
  availability: "available" | "busy" | "offline";
  locationRecordedAt?: string | null;
  activeRidesCount: number;
  completedRidesToday: number;
  acceptedCount: number;
  offeredCount: number;
  idleMinutes: number;
}

export interface DispatchEligibilityGuardrails {
  maxPickupEtaMinutes: number; // default: 15 mins
  maxLocationAgeMinutes: number; // default: 15 mins
  assumedSpeedKmh: number; // default: 30 km/h
  pickupBufferMinutes: number; // default: 2 mins
  idleSaturationMinutes: number; // default: 60 mins
  excludedDriverIds?: string[]; // drivers tried in current dispatch cycle
}

export const DEFAULT_GUARDRAILS: DispatchEligibilityGuardrails = {
  maxPickupEtaMinutes: 15,
  maxLocationAgeMinutes: 15,
  assumedSpeedKmh: 30,
  pickupBufferMinutes: 2,
  idleSaturationMinutes: 60,
  excludedDriverIds: [],
};

export interface FairRideWeights {
  eta: number; // 0.30
  idleTime: number; // 0.25
  distance: number; // 0.20
  workload: number; // 0.15
  reliability: number; // 0.10
}

export const FAIRRIDE_DEFAULT_WEIGHTS: FairRideWeights = {
  eta: 0.30,
  idleTime: 0.25,
  distance: 0.20,
  workload: 0.15,
  reliability: 0.10,
};

export interface ScoredDriverCandidate {
  userId: string;
  vehicleLabel: string;
  distanceKm: number;
  pickupEtaMinutes: number;
  rawWorkload: number;
  rawIdleMinutes: number;
  rawReliability: number;
  normalizedScores: {
    distanceScore: number;
    etaScore: number;
    workloadScore: number;
    reliabilityScore: number;
    idleScore: number;
  };
  scoreContributions: {
    distance: number;
    eta: number;
    workload: number;
    reliability: number;
    idle: number;
  };
  totalScore: number;
  explanation: string;
}

export interface DispatchDecision {
  method: "FairRide AI Fairness Allocation" | "Nearest Eligible Driver Baseline";
  eligibleCandidateCount: number;
  excludedCount: number;
  exclusionReasons: Record<string, number>;
  selectedCandidate: ScoredDriverCandidate | null;
  rankedCandidates: ScoredDriverCandidate[];
  baselineCandidate: ScoredDriverCandidate | null;
}

/**
 * Filter drivers strictly by eligibility guardrails before ranking.
 */
export function filterEligibleCandidates(
  drivers: CandidateDriverInput[],
  pickupLat: number,
  pickupLng: number,
  guardrails: DispatchEligibilityGuardrails = DEFAULT_GUARDRAILS,
  currentTime: Date = new Date()
): { eligible: Array<CandidateDriverInput & { distanceKm: number; pickupEtaMinutes: number }>; excludedReasons: Record<string, number> } {
  const eligible: Array<CandidateDriverInput & { distanceKm: number; pickupEtaMinutes: number }> = [];
  const excludedReasons: Record<string, number> = {
    offline: 0,
    busy: 0,
    active_ride: 0,
    stale_location: 0,
    eta_exceeded: 0,
    tried_in_cycle: 0,
  };

  const excludedSet = new Set(guardrails.excludedDriverIds || []);

  for (const d of drivers) {
    if (excludedSet.has(d.userId)) {
      excludedReasons.tried_in_cycle++;
      continue;
    }
    if (d.availability === "offline") {
      excludedReasons.offline++;
      continue;
    }
    if (d.availability === "busy") {
      excludedReasons.busy++;
      continue;
    }
    if (d.activeRidesCount > 0) {
      excludedReasons.active_ride++;
      continue;
    }

    if (d.locationRecordedAt) {
      const ageMinutes = (currentTime.getTime() - new Date(d.locationRecordedAt).getTime()) / (1000 * 60);
      if (ageMinutes > guardrails.maxLocationAgeMinutes) {
        excludedReasons.stale_location++;
        continue;
      }
    }

    const distanceKm = calculateHaversineDistanceKm(pickupLat, pickupLng, d.lat, d.lng);
    const travelTime = (distanceKm / Math.max(10, guardrails.assumedSpeedKmh)) * 60;
    const pickupEtaMinutes = Math.round((travelTime + guardrails.pickupBufferMinutes) * 10) / 10;

    if (pickupEtaMinutes > guardrails.maxPickupEtaMinutes) {
      excludedReasons.eta_exceeded++;
      continue;
    }

    eligible.push({ ...d, distanceKm, pickupEtaMinutes });
  }

  return { eligible, excludedReasons };
}

/**
 * Laplace-smoothed acceptance reliability calculation.
 * (accepted + alpha) / (offered + alpha + beta) with alpha=2, beta=2
 */
export function calculateSmoothedReliability(accepted: number, offered: number): number {
  const alpha = 2;
  const beta = 2;
  return Math.round(((accepted + alpha) / (offered + alpha + beta)) * 1000) / 1000;
}

/**
 * Score eligible drivers using the 5-factor normalized weights:
 * ETA 0.30, Idle Time 0.25, Distance 0.20, Workload 0.15, Reliability 0.10
 */
export function rankDriversWithFairness(
  eligibleDrivers: Array<CandidateDriverInput & { distanceKm: number; pickupEtaMinutes: number }>,
  weights: FairRideWeights = FAIRRIDE_DEFAULT_WEIGHTS,
  guardrails: DispatchEligibilityGuardrails = DEFAULT_GUARDRAILS
): ScoredDriverCandidate[] {
  if (eligibleDrivers.length === 0) return [];

  // Determine min/max for normalization across candidate set
  let minDistance = Infinity, maxDistance = -Infinity;
  let minEta = Infinity, maxEta = -Infinity;
  let minWorkload = Infinity, maxWorkload = -Infinity;

  for (const d of eligibleDrivers) {
    if (d.distanceKm < minDistance) minDistance = d.distanceKm;
    if (d.distanceKm > maxDistance) maxDistance = d.distanceKm;
    if (d.pickupEtaMinutes < minEta) minEta = d.pickupEtaMinutes;
    if (d.pickupEtaMinutes > maxEta) maxEta = d.pickupEtaMinutes;
    if (d.completedRidesToday < minWorkload) minWorkload = d.completedRidesToday;
    if (d.completedRidesToday > maxWorkload) maxWorkload = d.completedRidesToday;
  }

  const scored: ScoredDriverCandidate[] = eligibleDrivers.map((d) => {
    // 1. Distance quality (normalized against maxPickupDistance in guardrails)
    const maxPickupDistanceKm = (guardrails.maxPickupEtaMinutes * guardrails.assumedSpeedKmh) / 60;
    const distanceScore = Math.max(0, 1 - d.distanceKm / Math.max(1, maxPickupDistanceKm));
    
    // 2. ETA quality (normalized against maxPickupEtaMinutes guardrail)
    const etaScore = Math.max(0, 1 - d.pickupEtaMinutes / Math.max(1, guardrails.maxPickupEtaMinutes));
    
    // 3. Workload score (lower completed rides today = higher score to balance earnings)
    const maxTypicalWorkload = 20;
    const workloadScore = Math.max(0, 1 - d.completedRidesToday / maxTypicalWorkload);
    
    // 4. Smoothed reliability
    const reliabilityScore = calculateSmoothedReliability(d.acceptedCount, d.offeredCount);
    
    // 5. Idle time quality (capped at idleSaturationMinutes)
    const idleScore = Math.min(1.0, d.idleMinutes / guardrails.idleSaturationMinutes);

    // Score contributions
    const cDistance = Math.round(distanceScore * weights.distance * 1000) / 1000;
    const cEta = Math.round(etaScore * weights.eta * 1000) / 1000;
    const cWorkload = Math.round(workloadScore * weights.workload * 1000) / 1000;
    const cReliability = Math.round(reliabilityScore * weights.reliability * 1000) / 1000;
    const cIdle = Math.round(idleScore * weights.idleTime * 1000) / 1000;

    const totalScore = Math.round((cDistance + cEta + cWorkload + cReliability + cIdle) * 1000) / 1000;

    // Truthful explanation generator
    const explanation = `Matched via FairRide: Pickup ETA ${d.pickupEtaMinutes}m, idle for ${d.idleMinutes}m with ${d.completedRidesToday} prior trips today.`;

    return {
      userId: d.userId,
      vehicleLabel: d.vehicleLabel,
      distanceKm: d.distanceKm,
      pickupEtaMinutes: d.pickupEtaMinutes,
      rawWorkload: d.completedRidesToday,
      rawIdleMinutes: d.idleMinutes,
      rawReliability: reliabilityScore,
      normalizedScores: {
        distanceScore: Math.round(distanceScore * 100) / 100,
        etaScore: Math.round(etaScore * 100) / 100,
        workloadScore: Math.round(workloadScore * 100) / 100,
        reliabilityScore: Math.round(reliabilityScore * 100) / 100,
        idleScore: Math.round(idleScore * 100) / 100,
      },
      scoreContributions: {
        distance: cDistance,
        eta: cEta,
        workload: cWorkload,
        reliability: cReliability,
        idle: cIdle,
      },
      totalScore,
      explanation,
    };
  });

  // Deterministic sorting: higher totalScore wins, tie-break by lower ETA, then higher idleMinutes, then userId
  scored.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (a.pickupEtaMinutes !== b.pickupEtaMinutes) return a.pickupEtaMinutes - b.pickupEtaMinutes;
    if (b.rawIdleMinutes !== a.rawIdleMinutes) return b.rawIdleMinutes - a.rawIdleMinutes;
    return a.userId.localeCompare(b.userId);
  });

  return scored;
}

/**
 * Execute comprehensive dispatch calculation returning both FairRide choice and Baseline choice
 * on the exact same immutable input candidate set.
 */
export function executeDispatchMatching(
  drivers: CandidateDriverInput[],
  pickupLat: number,
  pickupLng: number,
  weights: FairRideWeights = FAIRRIDE_DEFAULT_WEIGHTS,
  guardrails: DispatchEligibilityGuardrails = DEFAULT_GUARDRAILS
): DispatchDecision {
  const { eligible, excludedReasons } = filterEligibleCandidates(
    drivers,
    pickupLat,
    pickupLng,
    guardrails
  );

  if (eligible.length === 0) {
    return {
      method: "FairRide AI Fairness Allocation",
      eligibleCandidateCount: 0,
      excludedCount: drivers.length,
      exclusionReasons: excludedReasons,
      selectedCandidate: null,
      rankedCandidates: [],
      baselineCandidate: null,
    };
  }

  // 1. FairRide multi-factor ranking
  const ranked = rankDriversWithFairness(eligible, weights, guardrails);
  const selectedCandidate = ranked[0];

  // 2. Nearest-eligible driver baseline (exact same eligible snapshot, pure min distance)
  const baselineList = [...ranked].sort((a, b) => {
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    if (a.pickupEtaMinutes !== b.pickupEtaMinutes) return a.pickupEtaMinutes - b.pickupEtaMinutes;
    return a.userId.localeCompare(b.userId);
  });
  const baselineCandidate = baselineList[0];

  return {
    method: "FairRide AI Fairness Allocation",
    eligibleCandidateCount: eligible.length,
    excludedCount: drivers.length - eligible.length,
    exclusionReasons: excludedReasons,
    selectedCandidate,
    rankedCandidates: ranked,
    baselineCandidate,
  };
}
