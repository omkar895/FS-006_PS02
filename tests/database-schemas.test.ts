import { describe, it, expect } from "vitest";
import { UserRoleSchema, DriverAvailabilitySchema, RideStatusSchema, ProfileSchema, RideSchema } from "@/lib/schemas/database";

describe("Database & Role Schemas Validation", () => {
  it("strictly validates allowed roles and rejects invalid roles", () => {
    expect(UserRoleSchema.safeParse("passenger").success).toBe(true);
    expect(UserRoleSchema.safeParse("driver").success).toBe(true);
    expect(UserRoleSchema.safeParse("admin").success).toBe(true);
    expect(UserRoleSchema.safeParse("superadmin").success).toBe(false);
    expect(UserRoleSchema.safeParse("guest").success).toBe(false);
  });

  it("validates driver availability states", () => {
    expect(DriverAvailabilitySchema.safeParse("offline").success).toBe(true);
    expect(DriverAvailabilitySchema.safeParse("available").success).toBe(true);
    expect(DriverAvailabilitySchema.safeParse("busy").success).toBe(true);
    expect(DriverAvailabilitySchema.safeParse("on_break").success).toBe(false);
  });

  it("validates ride statuses across full lifecycle", () => {
    const validStatuses = [
      "requested",
      "accepted",
      "arriving",
      "ongoing",
      "completed",
      "cancelled",
      "reassigning",
      "unassigned",
      "expired",
    ];
    for (const status of validStatuses) {
      expect(RideStatusSchema.safeParse(status).success).toBe(true);
    }
    expect(RideStatusSchema.safeParse("pending").success).toBe(false);
  });

  it("verifies profile schema rejects self-assigned arbitrary roles", () => {
    const validProfile = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      display_name: "Alice Passenger",
      role: "passenger",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(ProfileSchema.safeParse(validProfile).success).toBe(true);

    const invalidProfile = {
      ...validProfile,
      role: "root_hacker",
    };
    expect(ProfileSchema.safeParse(invalidProfile).success).toBe(false);
  });

  it("verifies ride schema enforces non-negative distance and bounded surge multiplier", () => {
    const validRide = {
      id: "123e4567-e89b-12d3-a456-426614174001",
      passenger_id: "123e4567-e89b-12d3-a456-426614174000",
      pickup_label: "Central Station",
      pickup_lat: 12.9716,
      pickup_lng: 77.5946,
      destination_label: "Tech Park",
      destination_lat: 12.9850,
      destination_lng: 77.6050,
      status: "requested",
      distance_km: 5.2,
      base_fare: 50.0,
      distance_fare: 78.0,
      surge_multiplier: 1.25,
      fare_estimate: 160.0,
      requested_at: new Date().toISOString(),
      match_metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(RideSchema.safeParse(validRide).success).toBe(true);

    // Negative distance
    expect(RideSchema.safeParse({ ...validRide, distance_km: -2 }).success).toBe(false);
    // Unbounded surge
    expect(RideSchema.safeParse({ ...validRide, surge_multiplier: 4.5 }).success).toBe(false);
  });
});
