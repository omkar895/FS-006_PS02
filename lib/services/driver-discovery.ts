import { calculateHaversineDistanceKm } from "@/lib/algorithms/pricing";

export interface NearbyDriverProjection {
  userId: string;
  vehicleLabel: string;
  vehicleType: string;
  lat: number;
  lng: number;
  availability: "available" | "busy" | "offline";
  locationSource: string;
  distanceKm: number;
  estimatedPickupMinutes: number;
  isStale: boolean;
}

export interface RawDriverRecord {
  user_id: string;
  vehicle_label: string;
  vehicle_type: string;
  current_lat: number | null;
  current_lng: number | null;
  availability: string;
  location_source: string;
  location_recorded_at: string | null;
}

/**
 * Filters out offline, busy, or stale drivers (older than maxAgeMinutes)
 * and projects valid coordinates with calculated straight-line distance and indicative ETA.
 */
export function filterAndProjectNearbyDrivers(
  drivers: RawDriverRecord[],
  pickupLat: number,
  pickupLng: number,
  maxAgeMinutes: number = 15,
  assumedSpeedKmh: number = 30,
  currentTime: Date = new Date()
): NearbyDriverProjection[] {
  const result: NearbyDriverProjection[] = [];

  for (const d of drivers) {
    if (d.availability !== "available") continue;
    if (d.current_lat === null || d.current_lng === null) continue;

    // Check freshness
    let isStale = false;
    if (d.location_recorded_at) {
      const recordedTime = new Date(d.location_recorded_at).getTime();
      const ageMinutes = (currentTime.getTime() - recordedTime) / (1000 * 60);
      if (ageMinutes > maxAgeMinutes) {
        isStale = true;
      }
    }

    if (isStale) continue; // Exclude stale drivers from live discovery

    const distanceKm = calculateHaversineDistanceKm(
      pickupLat,
      pickupLng,
      d.current_lat,
      d.current_lng
    );

    // Indicative pickup ETA = (distance / speed) * 60 + 2 min fixed buffer
    const travelMinutes = (distanceKm / Math.max(10, assumedSpeedKmh)) * 60;
    const estimatedPickupMinutes = Math.max(2, Math.round(travelMinutes + 2));

    result.push({
      userId: d.user_id,
      vehicleLabel: d.vehicle_label,
      vehicleType: d.vehicle_type,
      lat: d.current_lat,
      lng: d.current_lng,
      availability: "available",
      locationSource: d.location_source,
      distanceKm,
      estimatedPickupMinutes,
      isStale: false,
    });
  }

  // Sort by nearest distance
  result.sort((a, b) => a.distanceKm - b.distanceKm);
  return result;
}
