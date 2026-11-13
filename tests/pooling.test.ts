import { describe, it, expect } from "vitest";
import { evaluateTwoPassengerPool, PoolPassengerRequest } from "@/lib/algorithms/pooling";

describe("Phase 06 — Two-Passenger Pooling & Constraints", () => {
  const reqA: PoolPassengerRequest = {
    id: "req-A",
    passengerId: "passenger-1",
    passengerName: "Alice",
    pickupLat: 12.9716, // Downtown
    pickupLng: 77.5946,
    pickupLabel: "Downtown Central",
    destinationLat: 12.9850, // Tech Park East
    destinationLng: 77.6050,
    destinationLabel: "Tech Park East",
    directDistanceKm: 2.0,
    directEtaMinutes: 6,
    directFare: 80,
  };

  const reqB_Compatible: PoolPassengerRequest = {
    id: "req-B",
    passengerId: "passenger-2",
    passengerName: "Bob",
    pickupLat: 12.9730, // 0.2 km from Alice pickup
    pickupLng: 77.5950,
    pickupLabel: "Downtown Metro",
    destinationLat: 12.9870, // 0.3 km from Alice dropoff
    destinationLng: 77.6060,
    destinationLabel: "Tech Park North Gate",
    directDistanceKm: 2.1,
    directEtaMinutes: 6,
    directFare: 82,
  };

  const reqC_Incompatible_FarPickup: PoolPassengerRequest = {
    id: "req-C",
    passengerId: "passenger-3",
    passengerName: "Charlie",
    pickupLat: 13.0500, // Airport Corridor (> 10 km away)
    pickupLng: 77.6200,
    pickupLabel: "Airport Corridor",
    destinationLat: 12.9850,
    destinationLng: 77.6050,
    destinationLabel: "Tech Park East",
    directDistanceKm: 15.0,
    directEtaMinutes: 30,
    directFare: 260,
  };

  it("identifies compatible two-passenger pool and determines valid stop sequence", () => {
    const plan = evaluateTwoPassengerPool(reqA, reqB_Compatible);
    expect(plan.isCompatible).toBe(true);
    expect(plan.sequence.length).toBe(4);

    // Verify pickup-before-dropoff constraint
    const idxA_pickup = plan.sequence.findIndex((s) => s.passengerId === "req-A" && s.type === "pickup");
    const idxA_dropoff = plan.sequence.findIndex((s) => s.passengerId === "req-A" && s.type === "dropoff");
    const idxB_pickup = plan.sequence.findIndex((s) => s.passengerId === "req-B" && s.type === "pickup");
    const idxB_dropoff = plan.sequence.findIndex((s) => s.passengerId === "req-B" && s.type === "dropoff");

    expect(idxA_pickup).toBeLessThan(idxA_dropoff);
    expect(idxB_pickup).toBeLessThan(idxB_dropoff);

    // Verify savings and detour constraints
    expect(plan.passengerA.savingsAmount).toBeGreaterThan(0);
    expect(plan.passengerB.savingsAmount).toBeGreaterThan(0);
    expect(plan.passengerA.detourRatio).toBeLessThanOrEqual(1.35);
    expect(plan.passengerB.detourRatio).toBeLessThanOrEqual(1.35);
  });

  it("strictly rejects pool when pickups exceed proximity threshold", () => {
    const plan = evaluateTwoPassengerPool(reqA, reqC_Incompatible_FarPickup);
    expect(plan.isCompatible).toBe(false);
    expect(plan.rejectionReason).toContain("Pickups are");
  });
});
