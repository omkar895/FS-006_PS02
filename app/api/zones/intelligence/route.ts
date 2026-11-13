import { createAdminClient } from "@/lib/auth/admin";
import { ZoneIntelligenceService } from "@/lib/services/zone-intelligence";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export const runtime = "nodejs";

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: zones, error: zoneError } = await admin.from("zones").select("*");
    const { data: drivers, error: driverError } = await admin
      .from("driver_profiles")
      .select("*")
      .eq("availability", "available");

    if (zoneError || driverError) {
      return apiError("DATABASE_ERROR", "Failed to retrieve zones or driver supply", 500);
    }

    const artifact = ZoneIntelligenceService.loadForecastArtifact();
    const zoneCount = (zones || []).length;
    const availableTotal = (drivers || []).length;

    // Distribute supply per zone for prototype operations display
    const distributedPerZone = Math.max(1, Math.round(availableTotal / Math.max(1, zoneCount)));

    const intelligencePerZone = (zones || []).map((z) => {
      return ZoneIntelligenceService.calculateZoneIntelligence(
        z.slug,
        distributedPerZone
      );
    });

    return apiSuccess({
      modelMetadata: {
        modelName: artifact.modelName,
        modelVersion: artifact.modelVersion,
        targetHorizonMinutes: artifact.targetHorizonMinutes,
        isSynthetic: artifact.isSynthetic,
        evaluationMetrics: artifact.evaluationMetrics,
        generatedAt: artifact.generatedAt,
      },
      zoneIntelligence: intelligencePerZone,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error generating zone intelligence";
    return apiError("ZONE_INTELLIGENCE_FAILED", message, 500);
  }
}
