import { describe, it, expect } from "vitest";
import { ZoneIntelligenceService, DemandForecastArtifactSchema } from "@/lib/services/zone-intelligence";

describe("Phase 05 — Trained Demand Forecasting & Zone Intelligence", () => {
  it("successfully loads and strictly validates the trained forecast artifact schema", () => {
    const artifact = ZoneIntelligenceService.loadForecastArtifact();
    expect(DemandForecastArtifactSchema.safeParse(artifact).success).toBe(true);

    // Verify mandatory PS2 model requirements
    expect(artifact.modelName).toBe("HistGradientBoostingRegressor");
    expect(artifact.targetHorizonMinutes).toBe(30);
    expect(artifact.isSynthetic).toBe(true);
    expect(artifact.zoneForecasts.length).toBe(6);

    // Evaluation metrics exist and gradient boosting beats baseline
    const gbMae = artifact.evaluationMetrics.gradientBoosting.mae;
    const baseMae = artifact.evaluationMetrics.historicalBaseline.mae;
    expect(gbMae).toBeLessThan(baseMae);
    expect(gbMae).toBeGreaterThan(0);
  });

  it("calculates bounded simulated surge multiplier based on demand/supply ratio", () => {
    // High demand relative to supply (e.g. 28 demand vs 5 supply -> ratio ~5.6)
    const highPressure = ZoneIntelligenceService.calculateZoneIntelligence("downtown-central", 5);
    expect(highPressure.simulatedSurgeMultiplier).toBeGreaterThan(1.0);
    expect(highPressure.simulatedSurgeMultiplier).toBeLessThanOrEqual(3.0); // Clamped at 3.0x max

    // Adequate supply (e.g. 28 demand vs 35 supply -> ratio < 1.0)
    const calmPressure = ZoneIntelligenceService.calculateZoneIntelligence("downtown-central", 35);
    expect(calmPressure.simulatedSurgeMultiplier).toBe(1.0);
    expect(calmPressure.repositionRecommendation.needed).toBe(false);
  });

  it("generates truthful repositioning recommendation when driver deficit occurs", () => {
    const status = ZoneIntelligenceService.calculateZoneIntelligence("tech-park-east", 4);
    expect(status.repositionRecommendation.needed).toBe(true);
    expect(status.repositionRecommendation.deficit).toBeGreaterThan(0);
    expect(status.repositionRecommendation.reason).toContain("Forecast demand");
  });
});
