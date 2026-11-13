import {
  filterEligibleCandidates,
  rankDriversWithFairness,
  CandidateDriverInput,
  DEFAULT_GUARDRAILS,
  FairRideWeights,
  FAIRRIDE_DEFAULT_WEIGHTS,
} from "@/lib/algorithms/dispatch-matching";

export interface SimulationScenarioConfig {
  scenario: "balanced" | "high_demand" | "low_supply";
  requestCount: number; // e.g. 50
  driverCount: number; // e.g. 10
  seed: number; // e.g. 42
  maxPickupEtaMinutes: number; // e.g. 15
  customWeights?: FairRideWeights;
  monsoonRainMode?: boolean; // +35% demand increase, weather friction
}

export interface SimulationAlgorithmMetrics {
  algorithmName: "FairRide Fairness Engine" | "Nearest Eligible Driver Baseline";
  totalRequests: number;
  assignedCount: number;
  unassignedCount: number;
  completionRatePercent: number;
  avgPickupEtaMinutes: number;
  avgPickupDistanceKm: number;
  avgDriverIdleMinutes: number;
  workloadStandardDeviation: number; // Lower std dev = fairer distribution
  minTripsPerDriver: number;
  maxTripsPerDriver: number;
  giniCoefficient: number; // 0.0 = perfect equality, 1.0 = total inequality
}

export interface LorenzPoint {
  percentile: number; // 0 to 100% of driver fleet
  baseline: number; // Cumulative % trips for Baseline
  fairRide: number; // Cumulative % trips for Go-Fair
  perfect: number; // Line of equality (y = x)
}

export interface SimulationRunResult {
  runId: string;
  config: SimulationScenarioConfig;
  baseline: SimulationAlgorithmMetrics;
  fairRide: SimulationAlgorithmMetrics;
  lorenzCurve: LorenzPoint[];
  tradeOffAnalysis: {
    workloadFairnessGainPercent: number; // % reduction in workload std dev
    etaTradeOffMinutes: number; // fairRide avg ETA - baseline avg ETA
    unassignedDelta: number; // fairRide unassigned - baseline unassigned
    giniInequalityReductionPercent: number; // % reduction in Gini coefficient
  };
  generatedAt: string;
}

/**
 * Calculate Gini Coefficient for an array of values (e.g. trips per driver).
 * Gini = sum_i sum_j |y_i - y_j| / (2 * n^2 * mean)
 */
export function calculateGiniCoefficient(values: number[]): number {
  if (values.length <= 1) return 0;
  const n = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  const mean = sum / n;

  let diffSum = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      diffSum += Math.abs(values[i] - values[j]);
    }
  }

  const gini = diffSum / (2 * n * n * mean);
  return Math.round(gini * 1000) / 1000;
}

/**
 * Generate discrete 5-point Lorenz Curve for charting cumulative distribution
 */
export function calculateLorenzPoints(
  baselineCounts: number[],
  fairRideCounts: number[]
): LorenzPoint[] {
  const n = baselineCounts.length;
  if (n === 0) return [];

  const sortedBaseline = [...baselineCounts].sort((a, b) => a - b);
  const sortedFair = [...fairRideCounts].sort((a, b) => a - b);

  const totalBaseline = sortedBaseline.reduce((a, b) => a + b, 0) || 1;
  const totalFair = sortedFair.reduce((a, b) => a + b, 0) || 1;

  const points: LorenzPoint[] = [{ percentile: 0, baseline: 0, fairRide: 0, perfect: 0 }];

  const steps = [0.2, 0.4, 0.6, 0.8, 1.0];
  for (const step of steps) {
    const k = Math.round(step * n);
    const sumBase = sortedBaseline.slice(0, k).reduce((a, b) => a + b, 0);
    const sumFair = sortedFair.slice(0, k).reduce((a, b) => a + b, 0);

    points.push({
      percentile: Math.round(step * 100),
      baseline: Math.round((sumBase / totalBaseline) * 100),
      fairRide: Math.round((sumFair / totalFair) * 100),
      perfect: Math.round(step * 100),
    });
  }

  return points;
}

// Simple pseudo-random generator with fixed seed
function pseudoRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Executes a deterministic, side-by-side simulation comparing Nearest Baseline
 * and FairRide Fairness Engine over the exact same clone of candidate drivers & requests.
 */
export function runSimulationLab(config: SimulationScenarioConfig): SimulationRunResult {
  const rand = pseudoRandom(config.seed);

  // 1. Generate deterministic synthetic drivers in Bangalore central area
  const baseLat = 12.9716;
  const baseLng = 77.5946;

  const initialDrivers: CandidateDriverInput[] = [];
  for (let i = 0; i < config.driverCount; i++) {
    const latOffset = (rand() - 0.5) * 0.08;
    const lngOffset = (rand() - 0.5) * 0.08;
    initialDrivers.push({
      userId: `driver-sim-${i + 1}`,
      vehicleLabel: `Fleet Vehicle ${i + 1}`,
      vehicleType: "standard",
      lat: Math.round((baseLat + latOffset) * 10000) / 10000,
      lng: Math.round((baseLng + lngOffset) * 10000) / 10000,
      availability: "available",
      locationRecordedAt: new Date().toISOString(),
      activeRidesCount: 0,
      completedRidesToday: Math.floor(rand() * 8), // Some start with prior workload
      acceptedCount: 20 + Math.floor(rand() * 30),
      offeredCount: 25 + Math.floor(rand() * 30),
      idleMinutes: 5 + Math.floor(rand() * 50),
    });
  }

  // 2. Generate deterministic requests (Monsoon boost +35% if enabled)
  const effectiveRequestCount = config.monsoonRainMode
    ? Math.round(config.requestCount * 1.35)
    : config.requestCount;

  const requests: Array<{ id: string; lat: number; lng: number }> = [];
  for (let r = 0; r < effectiveRequestCount; r++) {
    const pLat = baseLat + (rand() - 0.5) * 0.07;
    const pLng = baseLng + (rand() - 0.5) * 0.07;
    requests.push({
      id: `req-sim-${r + 1}`,
      lat: Math.round(pLat * 10000) / 10000,
      lng: Math.round(pLng * 10000) / 10000,
    });
  }

  // 3. Simulate Baseline Execution (Nearest Eligible Driver)
  const baselineDrivers: CandidateDriverInput[] = JSON.parse(JSON.stringify(initialDrivers));
  const { metrics: baselineMetrics, counts: baselineCounts } = simulateScenario(
    "Nearest Eligible Driver Baseline",
    baselineDrivers,
    requests,
    config.maxPickupEtaMinutes,
    "baseline",
    config.customWeights,
    config.monsoonRainMode
  );

  // 4. Simulate FairRide Execution (Fairness Multi-Factor)
  const fairRideDrivers: CandidateDriverInput[] = JSON.parse(JSON.stringify(initialDrivers));
  const { metrics: fairRideMetrics, counts: fairRideCounts } = simulateScenario(
    "FairRide Fairness Engine",
    fairRideDrivers,
    requests,
    config.maxPickupEtaMinutes,
    "fairride",
    config.customWeights,
    config.monsoonRainMode
  );

  // 5. Compare trade-offs and calculate Lorenz Points
  const fairnessGain =
    baselineMetrics.workloadStandardDeviation > 0
      ? Math.round(
          ((baselineMetrics.workloadStandardDeviation - fairRideMetrics.workloadStandardDeviation) /
            baselineMetrics.workloadStandardDeviation) *
            1000
        ) / 10
      : 0;

  const etaTradeOff =
    Math.round((fairRideMetrics.avgPickupEtaMinutes - baselineMetrics.avgPickupEtaMinutes) * 10) / 10;

  const giniGain =
    baselineMetrics.giniCoefficient > 0
      ? Math.round(
          ((baselineMetrics.giniCoefficient - fairRideMetrics.giniCoefficient) /
            baselineMetrics.giniCoefficient) *
            1000
        ) / 10
      : 0;

  const lorenzCurve = calculateLorenzPoints(baselineCounts, fairRideCounts);

  return {
    runId: `sim-run-${config.seed}-${Date.now()}`,
    config,
    baseline: baselineMetrics,
    fairRide: fairRideMetrics,
    lorenzCurve,
    tradeOffAnalysis: {
      workloadFairnessGainPercent: fairnessGain,
      etaTradeOffMinutes: etaTradeOff,
      unassignedDelta: fairRideMetrics.unassignedCount - baselineMetrics.unassignedCount,
      giniInequalityReductionPercent: giniGain,
    },
    generatedAt: new Date().toISOString(),
  };
}

function simulateScenario(
  algorithmName: "FairRide Fairness Engine" | "Nearest Eligible Driver Baseline",
  fleet: CandidateDriverInput[],
  requests: Array<{ id: string; lat: number; lng: number }>,
  maxEtaMinutes: number,
  mode: "baseline" | "fairride",
  customWeights?: FairRideWeights,
  monsoonRainMode?: boolean
): { metrics: SimulationAlgorithmMetrics; counts: number[] } {
  let assignedCount = 0;
  let totalEta = 0;
  let totalDistance = 0;
  const tripsPerDriver: Record<string, number> = {};
  fleet.forEach((d) => (tripsPerDriver[d.userId] = d.completedRidesToday));

  const weights = customWeights || FAIRRIDE_DEFAULT_WEIGHTS;
  const speedFriction = monsoonRainMode ? 0.75 : 1.0; // 25% slower in rain

  for (const req of requests) {
    const { eligible } = filterEligibleCandidates(fleet, req.lat, req.lng, {
      ...DEFAULT_GUARDRAILS,
      maxPickupEtaMinutes: maxEtaMinutes,
      assumedSpeedKmh: Math.round(DEFAULT_GUARDRAILS.assumedSpeedKmh * speedFriction),
    });

    if (eligible.length === 0) continue;

    let chosenDriver: { userId: string; distanceKm: number; pickupEtaMinutes: number };

    if (mode === "baseline") {
      // Sort strictly by nearest distance
      eligible.sort((a, b) => a.distanceKm - b.distanceKm);
      chosenDriver = eligible[0];
    } else {
      // Rank via FairRide multi-factor with configurable weights
      const ranked = rankDriversWithFairness(eligible, weights);
      chosenDriver = ranked[0];
    }

    assignedCount++;
    totalEta += chosenDriver.pickupEtaMinutes;
    totalDistance += chosenDriver.distanceKm;
    tripsPerDriver[chosenDriver.userId]++;

    // Update fleet state in simulation
    const driverRef = fleet.find((d) => d.userId === chosenDriver.userId);
    if (driverRef) {
      driverRef.completedRidesToday++;
      driverRef.idleMinutes = 0; // Reset idle timer upon assignment
    }
  }

  const unassignedCount = requests.length - assignedCount;
  const avgPickupEtaMinutes = assignedCount > 0 ? Math.round((totalEta / assignedCount) * 10) / 10 : 0;
  const avgPickupDistanceKm = assignedCount > 0 ? Math.round((totalDistance / assignedCount) * 100) / 100 : 0;

  // Workload variance / standard deviation
  const counts = Object.values(tripsPerDriver);
  const meanTrips = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance = counts.reduce((acc, val) => acc + Math.pow(val - meanTrips, 2), 0) / counts.length;
  const workloadStandardDeviation = Math.round(Math.sqrt(variance) * 100) / 100;

  // Calculate Gini Coefficient
  const giniCoefficient = calculateGiniCoefficient(counts);

  const avgDriverIdleMinutes = Math.round(
    fleet.reduce((acc, d) => acc + d.idleMinutes, 0) / fleet.length
  );

  return {
    metrics: {
      algorithmName,
      totalRequests: requests.length,
      assignedCount,
      unassignedCount,
      completionRatePercent: Math.round((assignedCount / requests.length) * 100),
      avgPickupEtaMinutes,
      avgPickupDistanceKm,
      avgDriverIdleMinutes,
      workloadStandardDeviation,
      minTripsPerDriver: Math.min(...counts),
      maxTripsPerDriver: Math.max(...counts),
      giniCoefficient,
    },
    counts,
  };
}
