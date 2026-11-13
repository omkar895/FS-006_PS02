import { describe, it, expect } from "vitest";
import { filterAndProjectNearbyDrivers, RawDriverRecord } from "@/lib/services/driver-discovery";

describe("Nearby Driver Discovery & Stale Filter", () => {
  const mockDrivers: RawDriverRecord[] = [
    {
      user_id: "123e4567-e89b-12d3-a456-426614174010",
      vehicle_label: "Sedan Alpha",
      vehicle_type: "standard",
      current_lat: 12.9750,
      current_lng: 77.5950,
      availability: "available",
      location_source: "simulated",
      location_recorded_at: new Date().toISOString(),
    },
    {
      user_id: "123e4567-e89b-12d3-a456-426614174011",
      vehicle_label: "Sedan Busy",
      vehicle_type: "standard",
      current_lat: 12.9720,
      current_lng: 77.5940,
      availability: "busy", // Should be filtered out
      location_source: "simulated",
      location_recorded_at: new Date().toISOString(),
    },
    {
      user_id: "123e4567-e89b-12d3-a456-426614174012",
      vehicle_label: "Sedan Stale Location",
      vehicle_type: "standard",
      current_lat: 12.9710,
      current_lng: 77.5940,
      availability: "available",
      location_source: "simulated",
      // Recorded 45 minutes ago (older than 15 min threshold)
      location_recorded_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      user_id: "123e4567-e89b-12d3-a456-426614174013",
      vehicle_label: "Sedan Offline",
      vehicle_type: "standard",
      current_lat: 12.9760,
      current_lng: 77.5960,
      availability: "offline", // Should be filtered out
      location_source: "simulated",
      location_recorded_at: new Date().toISOString(),
    },
  ];

  it("filters out busy, offline, and stale drivers", () => {
    const pickupLat = 12.9716;
    const pickupLng = 77.5946;

    const nearby = filterAndProjectNearbyDrivers(mockDrivers, pickupLat, pickupLng, 15);
    expect(nearby.length).toBe(1);
    expect(nearby[0].userId).toBe("123e4567-e89b-12d3-a456-426614174010");
    expect(nearby[0].distanceKm).toBeGreaterThan(0);
    expect(nearby[0].estimatedPickupMinutes).toBeGreaterThanOrEqual(2);
  });
});
