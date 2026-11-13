import { PoolingService } from "@/lib/services/pooling-service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export const runtime = "nodejs";

export async function GET() {
  try {
    const candidates = await PoolingService.discoverPoolingCandidates();
    return apiSuccess({
      candidatePoolsCount: candidates.length,
      pools: candidates,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error querying pooling candidates";
    return apiError("POOLING_DISCOVERY_FAILED", message, 500);
  }
}
