/**
 * OSRM (Open Source Routing Machine) Client Service
 * Provides real-world driving road geometry and turn-by-turn route coordinates.
 * Includes automatic timeout and graceful fallback to straight-line coordinates.
 */

export interface RealRoadRouteResult {
  coordinates: [number, number][]; // [lat, lng] array along actual roads
  distanceKm: number;
  durationMinutes: number;
  isRealRoad: boolean;
}

export async function fetchRealRoadRoute(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number
): Promise<RealRoadRouteResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    // OSRM expects coordinates in lng,lat order
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`OSRM HTTP error: ${res.status}`);
    }

    const data = await res.json();

    if (data.code === "Ok" && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      // OSRM GeoJSON geometry coordinates are [lng, lat], Leaflet requires [lat, lng]
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );

      const distanceKm = Number((route.distance / 1000).toFixed(2));
      const durationMinutes = Math.max(1, Math.round(route.duration / 60));

      return {
        coordinates,
        distanceKm,
        durationMinutes,
        isRealRoad: true,
      };
    }
  } catch (err: unknown) {
    console.warn("OSRM routing fallback to straight line:", err instanceof Error ? err.message : err);
  }

  // Graceful fallback to straight-line coordinates if OSRM is unreachable or timed out
  const fallbackDistanceKm = Number(
    Math.hypot((destLat - startLat) * 111, (destLng - startLng) * 85).toFixed(2)
  );

  return {
    coordinates: [
      [startLat, startLng],
      [destLat, destLng],
    ],
    distanceKm: fallbackDistanceKm,
    durationMinutes: Math.max(2, Math.round((fallbackDistanceKm / 30) * 60)),
    isRealRoad: false,
  };
}
