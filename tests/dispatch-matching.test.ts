import { describe, it, expect } from "vitest";
import {
  filterEligibleCandidates,
  executeDispatchMatching,
  calculateSmoothedReliability,
  CandidateDriverInput,
} from "@/lib/algorithms/dispatch-matching";

describe("Phase 04 — Fairness-Aware Dispatch Engine & Explanations", () => {
  const candidateFleet: CandidateDriverInput[] = [
    {
      userId: "driver-nearest-overworked",
      vehicleLabel: "Sedan Alpha",
      vehicleType: "standard",
      lat: 12.9720, // 0.1 km away from 12.9716, 77.5946
      lng: 77.5950,
      availability: "available",
      locationRecordedAt: new Date().toISOString(),
      activeRidesCount: 0,
      completedRidesToday: 18, // Very high workload
      acceptedCount: 50,
      offeredCount: 55,
      idleMinutes: 2, // Just completed a ride 2 mins ago
    },
    {
      userId: "driver-fairness-deserving",
      vehicleLabel: "Sedan Beta",
      vehicleType: "standard",
      lat: 12.9780, // ~0.8 km away
      lng: 77.5970,
      availability: "available",
      locationRecordedAt: new Date().toISOString(),
      activeRidesCount: 0,
      completedRidesToday: 3, // Low workload today
      acceptedCount: 40,
      offeredCount: 42,
      idleMinutes: 45, // Waited 45 mins without an assignment
    },
    {
      userId: "driver-too-far",
      vehicleLabel: "Sedan Gamma",
      vehicleType: "standard",
      lat: 13.1500, // Very far away (> 20 km)
      lng: 77.6500,
      availability: "available",
      locationRecordedAt: new Date().toISOString(),
      activeRidesCount: 0,
      completedRidesToday: 1,
      acceptedCount: 20,
      offeredCount: 20,
      idleMinutes: 60,
    },
    {
      userId: "driver-busy",
      vehicleLabel: "Sedan Delta",
      vehicleType: "standard",
      lat: 12.9730,
      lng: 77.5950,
      availability: "busy", // Ineligible
      locationRecordedAt: new Date().toISOString(),
      activeRidesCount: 1,
      completedRidesToday: 5,
      acceptedCount: 20,
      offeredCount: 20,
      idleMinutes: 0,
    },
  ];

  it("strictly filters out busy drivers and drivers exceeding max pickup ETA", () => {
    const pickupLat = 12.9716;
    const pickupLng = 77.5946;

    const { eligible, excludedReasons } = filterEligibleCandidates(
      candidateFleet,
      pickupLat,
      pickupLng,
      {
        maxPickupEtaMinutes: 15,
        maxLocationAgeMinutes: 15,
        assumedSpeedKmh: 30,
        pickupBufferMinutes: 2,
        idleSaturationMinutes: 60,
      }
    );

    expect(eligible.length).toBe(2);
    expect(excludedReasons.busy).toBe(1);
    expect(excludedReasons.eta_exceeded).toBe(1);
    expect(eligible.map((d) => d.userId)).toContain("driver-nearest-overworked");
    expect(eligible.map((d) => d.userId)).toContain("driver-fairness-deserving");
  });

  it("demonstrates that nearest driver does not always win when fairness factors dominate", () => {
    const pickupLat = 12.9716;
    const pickupLng = 77.5946;

    const decision = executeDispatchMatching(candidateFleet, pickupLat, pickupLng);

    // Baseline picks nearest driver
    expect(decision.baselineCandidate?.userId).toBe("driver-nearest-overworked");

    // FairRide selects the driver with low workload and longer idle time (45 mins idle, 3 trips)
    expect(decision.selectedCandidate?.userId).toBe("driver-fairness-deserving");
    expect(decision.selectedCandidate?.totalScore).toBeGreaterThan(
      decision.baselineCandidate?.totalScore || 0
    );
  });

  it("verifies weights sum to 1.0 and factor contributions match explanation", () => {
    const pickupLat = 12.9716;
    const pickupLng = 77.5946;

    const decision = executeDispatchMatching(candidateFleet, pickupLat, pickupLng);
    const selected = decision.selectedCandidate!;

    // Total score is bounded between 0 and 1
    expect(selected.totalScore).toBeGreaterThan(0);
    expect(selected.totalScore).toBeLessThanOrEqual(1.0);

    // Score contributions add up to totalScore within rounding tolerance
    const sumContrib =
      selected.scoreContributions.distance +
      selected.scoreContributions.eta +
      selected.scoreContributions.workload +
      selected.scoreContributions.reliability +
      selected.scoreContributions.idle;

    expect(Math.abs(sumContrib - selected.totalScore)).toBeLessThan(0.01);

    // Truthful explanation is populated
    expect(selected.explanation).toContain("Matched via FairRide");
    expect(selected.explanation).toContain("idle for 45m with 3 prior trips today");
  });

  it("calculates Laplace smoothed reliability properly", () => {
    // 0/0 history starts at neutral 0.5 (2/4)
    expect(calculateSmoothedReliability(0, 0)).toBe(0.5);
    // 10/10 history gives 12/14 = ~0.857
    expect(calculateSmoothedReliability(10, 10)).toBe(0.857);
    // 1 decline after 1 offer (1/2 = 0.5) is not harshly penalized to 0.0
    expect(calculateSmoothedReliability(0, 1)).toBe(0.4);
  });
});
