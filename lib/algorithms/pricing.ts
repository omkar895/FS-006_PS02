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
  assumedSpeedKmh: number = 30
): FareCalculation {
  const clampedSurge = Math.max(1.0, Math.min(3.0, surgeMultiplier));
  const baseFare = 50.0; // Base flag-drop fare
  const perKmRate = 15.0; // ₹15/km
  const distanceFare = Math.round(distanceKm * perKmRate * 100) / 100;

  const rawFare = (baseFare + distanceFare) * clampedSurge;
  const fareEstimate = Math.round(rawFare * 100) / 100;

  // Approximate trip duration based on assumed speed
  const tripHours = distanceKm / Math.max(10, assumedSpeedKmh);
  const tripEtaMinutes = Math.max(5, Math.round(tripHours * 60));

  return {
    baseFare,
    distanceFare,
    surgeMultiplier: clampedSurge,
    fareEstimate,
    tripEtaMinutes,
  };
}

