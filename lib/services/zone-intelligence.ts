import { z } from "zod";
import fs from "fs";
import path from "path";

export const DemandForecastArtifactSchema = z.object({
  modelName: z.string(),
  modelVersion: z.string(),
  targetHorizonMinutes: z.literal(30),
  isSynthetic: z.boolean(),
  randomSeed: z.number(),
  featuresUsed: z.array(z.string()),
  trainRowCount: z.number().positive(),
  testRowCount: z.number().positive(),
  splitDates: z.object({
    trainStart: z.string(),
    trainEnd: z.string(),
    testStart: z.string(),
    testEnd: z.string(),
  }),
  evaluationMetrics: z.object({
    gradientBoosting: z.object({
      mae: z.number().nonnegative(),
      rmse: z.number().nonnegative(),
    }),
    historicalBaseline: z.object({
      mae: z.number().nonnegative(),
      rmse: z.number().nonnegative(),
    }),
  }),
  zoneForecasts: z.array(
    z.object({
      zoneSlug: z.string(),
      forecastHorizonMinutes: z.literal(30),
      predictedDemand: z.number().nonnegative(),
      currentObservedDemand: z.number().nonnegative(),
      modelImprovementOverBaselineMae: z.number(),
    })
  ),
  generatedAt: z.string(),
});

export type DemandForecastArtifact = z.infer<typeof DemandForecastArtifactSchema>;

export interface ZoneIntelligenceStatus {
  zoneSlug: string;
  predictedDemand30m: number;
  availableDriversSupply: number;
  demandSupplyRatio: number;
  simulatedSurgeMultiplier: number;
  repositionRecommendation: {
    needed: boolean;
    deficit: number;
    reason: string;
  };
}

export class ZoneIntelligenceService {
  private static cachedArtifact: DemandForecastArtifact | null = null;

  static loadForecastArtifact(): DemandForecastArtifact {
    if (this.cachedArtifact) {
      return this.cachedArtifact;
    }

    const artifactPath = path.resolve(process.cwd(), "data/generated/zone-demand-forecast.json");
    if (!fs.existsSync(artifactPath)) {
      throw new Error(`FORECAST_ARTIFACT_MISSING: ${artifactPath}`);
    }

    const raw = fs.readFileSync(artifactPath, "utf-8");
    const json = JSON.parse(raw);
    const parsed = DemandForecastArtifactSchema.safeParse(json);

    if (!parsed.success) {
      throw new Error(`FORECAST_ARTIFACT_INVALID: ${parsed.error.message}`);
    }

    this.cachedArtifact = parsed.data;
    return this.cachedArtifact;
  }

  /**
   * Combines forward 30-min forecast demand and available driver supply
   * to compute bounded simulated surge and idle-driver reposition recommendations.
   */
  static calculateZoneIntelligence(
    zoneSlug: string,
    availableSupply: number
  ): ZoneIntelligenceStatus {
    const artifact = this.loadForecastArtifact();
    const zoneForecast = artifact.zoneForecasts.find((z) => z.zoneSlug === zoneSlug);

    const predictedDemand = zoneForecast ? zoneForecast.predictedDemand : 15.0;
    const supplyFloor = Math.max(1, availableSupply); // Protect against divide-by-zero
    const ratio = Math.round((predictedDemand / supplyFloor) * 100) / 100;

    // Bounded surge calculation: 1.0x to 3.0x
    let surgeMultiplier = 1.0;
    if (ratio > 1.2) {
      surgeMultiplier = Math.min(3.0, Math.round((1.0 + (ratio - 1.2) * 0.4) * 100) / 100);
    }

    // Repositioning recommendation
    const needed = ratio > 1.4 && availableSupply < predictedDemand * 0.7;
    const deficit = needed ? Math.max(1, Math.round(predictedDemand - availableSupply)) : 0;
    const reason = needed
      ? `Forecast demand (${predictedDemand}) exceeds current driver supply (${availableSupply}) by 30+ mins ahead.`
      : "Zone supply is currently adequate to meet predicted demand.";

    return {
      zoneSlug,
      predictedDemand30m: predictedDemand,
      availableDriversSupply: availableSupply,
      demandSupplyRatio: ratio,
      simulatedSurgeMultiplier: surgeMultiplier,
      repositionRecommendation: {
        needed,
        deficit,
        reason,
      },
    };
  }
}

