import { describe, it, expect } from "vitest";
import { calculateHaversineDistanceKm, calculateFareEstimate } from "@/lib/algorithms/pricing";

describe("Pricing & Distance Algorithm", () => {
  it("calculates realistic straight-line Haversine distances", () => {
    // Bangalore Central to Tech Park (~2.0 km)
    const distance = calculateHaversineDistanceKm(12.9716, 77.5946, 12.9850, 77.6050);
    expect(distance).toBeGreaterThan(1.5);
    expect(distance).toBeLessThan(2.5);
  });

  it("calculates fare estimate with base fare, distance rate, and surge bounds", () => {
    const normalFare = calculateFareEstimate(5.0, 1.0, 30);
    expect(normalFare.baseFare).toBe(50.0);
    expect(normalFare.distanceFare).toBe(75.0); // 5km * 15
    expect(normalFare.fareEstimate).toBe(125.0); // (50 + 75) * 1.0

    // Surge 1.5x
    const surgeFare = calculateFareEstimate(5.0, 1.5, 30);
    expect(surgeFare.fareEstimate).toBe(187.5);

    // Clamped surge (cannot exceed 3.0x)
    const excessiveSurge = calculateFareEstimate(5.0, 5.0, 30);
    expect(excessiveSurge.surgeMultiplier).toBe(3.0);
    expect(excessiveSurge.fareEstimate).toBe(375.0);
  });
});

