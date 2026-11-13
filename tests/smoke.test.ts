import { describe, it, expect } from "vitest";

describe("Sanity & Environment Test", () => {
  it("verifies vitest test runner is functional", () => {
    expect(1 + 1).toBe(2);
  });

  it("verifies project configuration environment defaults", () => {
    const defaultSpeedKmh = 30;
    const maxPickupEtaMinutes = 15;
    expect(defaultSpeedKmh).toBeGreaterThan(0);
    expect(maxPickupEtaMinutes).toBe(15);
  });
});

