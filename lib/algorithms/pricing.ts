/**
 * Haversine straight-line distance in kilometers.
 * Label: Straight-line estimate (Haversine formula).
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 100) / 100;
}

export interface FareCalculation {
  baseFare: number;
  distanceFare: number;
  surgeMultiplier: number;
  fareEstimate: number;
  tripEtaMinutes: number;
}

export function calculateFareEstimate(
  distanceKm: number,
  surgeMultiplier: number = 1.0,
  assumedSpeedKmh: number = 30,
  vehicleMode: "cab" | "bike" = "cab"
): FareCalculation {
  const clampedSurge = Math.max(1.0, Math.min(3.0, surgeMultiplier));
  const isBike = vehicleMode === "bike";
  const baseFare = isBike ? 25.0 : 50.0;
  const perKmRate = isBike ? 8.0 : 15.0;
  const distanceFare = Math.round(distanceKm * perKmRate * 100) / 100;

  const rawFare = (baseFare + distanceFare) * clampedSurge;
  const fareEstimate = Math.round(rawFare * 100) / 100;

  // Bikes are nimbler in city traffic, giving a slightly faster ETA
  const effectiveSpeed = isBike ? Math.max(assumedSpeedKmh, 35) : Math.max(10, assumedSpeedKmh);
  const tripHours = distanceKm / effectiveSpeed;
  const tripEtaMinutes = Math.max(isBike ? 3 : 5, Math.round(tripHours * 60));

  return {
    baseFare,
    distanceFare,
    surgeMultiplier: clampedSurge,
    fareEstimate,
    tripEtaMinutes,
  };
}

