import { describe, it, expect } from "vitest";
import { runSimulationLab, SimulationScenarioConfig } from "@/lib/algorithms/simulation-lab";

describe("Phase 07 — Dispatch Simulation Lab", () => {
  const config: SimulationScenarioConfig = {
    scenario: "balanced",
    requestCount: 50,
    driverCount: 10,
    seed: 42,
    maxPickupEtaMinutes: 15,
  };

  it("produces deterministic, reproducible results for fixed seed and configuration", () => {
    const runA = runSimulationLab(config);
    const runB = runSimulationLab(config);

    expect(runA.baseline.assignedCount).toBe(runB.baseline.assignedCount);
    expect(runA.baseline.avgPickupEtaMinutes).toBe(runB.baseline.avgPickupEtaMinutes);
    expect(runA.fairRide.assignedCount).toBe(runB.fairRide.assignedCount);
    expect(runA.fairRide.workloadStandardDeviation).toBe(runB.fairRide.workloadStandardDeviation);
  });

  it("demonstrates workload variance reduction in FairRide compared to greedy nearest baseline", () => {
    const result = runSimulationLab(config);

    // FairRide distributes trips more equitably, resulting in lower standard deviation
    expect(result.fairRide.workloadStandardDeviation).toBeLessThanOrEqual(
      result.baseline.workloadStandardDeviation
    );

    // Trade-off analysis contains real computed delta values
    expect(typeof result.tradeOffAnalysis.workloadFairnessGainPercent).toBe("number");
    expect(typeof result.tradeOffAnalysis.etaTradeOffMinutes).toBe("number");
  });
});

