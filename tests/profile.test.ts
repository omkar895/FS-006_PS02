import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "@/app/api/profile/route";

describe("Profile Management & Vehicle Specs API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("handles GET /api/profile and returns user profile data", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toBeDefined();
    expect(json.data.displayName).toBeDefined();
  });

  it("handles PATCH /api/profile to update passenger display name", async () => {
    const req = new Request("http://localhost:3000/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: "Ananya Sharma",
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.displayName).toBe("Ananya Sharma");
  });

  it("handles PATCH /api/profile to update driver vehicle specifications", async () => {
    const req = new Request("http://localhost:3000/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: "Driver Alpha",
        vehicleLabel: "Hyundai Ioniq 5 EV (Obsidian Black)",
        vehicleRegistrationLabel: "KA-03-EV-9900",
        vehicleType: "electric_ev",
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.driverDetails.vehicleLabel).toBe("Hyundai Ioniq 5 EV (Obsidian Black)");
    expect(json.data.driverDetails.vehicleRegistrationLabel).toBe("KA-03-EV-9900");
  });

  it("rejects invalid PATCH payloads with 400 validation error", async () => {
    const req = new Request("http://localhost:3000/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: "A", // too short (min 2)
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("Validation failed");
  });
});
