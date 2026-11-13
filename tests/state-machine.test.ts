import { describe, it, expect } from "vitest";
import { isValidRideTransition } from "@/lib/algorithms/state-machine";

describe("Ride State Machine Invariants & Lifecycle", () => {
  it("allows correct happy path transitions: requested -> accepted -> arriving -> ongoing -> completed", () => {
    expect(isValidRideTransition("requested", "accepted", "driver").valid).toBe(true);
    expect(isValidRideTransition("accepted", "arriving", "driver").valid).toBe(true);
    expect(isValidRideTransition("arriving", "ongoing", "driver").valid).toBe(true);
    expect(isValidRideTransition("ongoing", "completed", "driver").valid).toBe(true);
  });

  it("strictly forbids skipped states or reverse transitions", () => {
    // Skipping arriving
    expect(isValidRideTransition("accepted", "ongoing", "driver").valid).toBe(false);
    // Skipping to completed directly from requested
    expect(isValidRideTransition("requested", "completed", "driver").valid).toBe(false);
    // Reverse transition
    expect(isValidRideTransition("completed", "ongoing", "driver").valid).toBe(false);
    expect(isValidRideTransition("arriving", "requested", "driver").valid).toBe(false);
  });

  it("enforces terminal state lock: completed, cancelled, expired, unassigned cannot transition", () => {
    expect(isValidRideTransition("completed", "requested", "admin").valid).toBe(false);
    expect(isValidRideTransition("cancelled", "accepted", "driver").valid).toBe(false);
    expect(isValidRideTransition("expired", "arriving", "driver").valid).toBe(false);
    expect(isValidRideTransition("unassigned", "accepted", "driver").valid).toBe(false);
  });

  it("enforces role permissions: passengers cannot accept or progress driver states", () => {
    // Passenger attempting to accept
    expect(isValidRideTransition("requested", "accepted", "passenger").valid).toBe(false);
    // Passenger attempting to complete
    expect(isValidRideTransition("ongoing", "completed", "passenger").valid).toBe(false);
    // Passenger CAN cancel a requested ride
    expect(isValidRideTransition("requested", "cancelled", "passenger").valid).toBe(true);
  });

  it("allows dispatch system / admin to reassign on driver rejection or timeout", () => {
    expect(isValidRideTransition("requested", "reassigning", "admin").valid).toBe(true);
    expect(isValidRideTransition("reassigning", "requested", "admin").valid).toBe(true);
    expect(isValidRideTransition("reassigning", "unassigned", "admin").valid).toBe(true);
  });
});

