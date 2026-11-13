import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PublicTripTrackerPage from "@/app/trip/[id]/page";

// Mock next/navigation
let mockParams = { id: "trip-test-777" };
vi.mock("next/navigation", () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/trip/trip-test-777",
}));

// Mock OperationsMap
vi.mock("@/components/maps/map-wrapper", () => ({
  default: () => <div data-testid="operations-map-mock">Mocked Live Trip Map</div>,
}));

// Mock routing service
vi.mock("@/lib/services/routing-service", () => ({
  fetchRealRoadRoute: vi.fn().mockResolvedValue({
    coordinates: [
      [12.9784, 77.5683],
      [12.9716, 77.5946],
    ],
    distanceKm: 2.95,
    durationMinutes: 6.5,
  }),
}));

describe("Public Trip Live Tracker (/trip/[id]) DOM Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockTripData = {
    data: {
      id: "trip-test-777",
      status: "ongoing",
      pickup_label: "Central Station Hub",
      pickup_lat: 12.9784,
      pickup_lng: 77.5683,
      destination_label: "Downtown Commercial Center",
      destination_lat: 12.9716,
      destination_lng: 77.5946,
      distance_km: 4.0,
      fare_estimate: 110.5,
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      driver: {
        vehicle_label: "Toyota Innova (KA-01-EQ-4491)",
        vehicle_type: "sedan",
        current_lat: 12.975,
        current_lng: 77.581,
        rating: 4.95,
      },
    },
  };

  it("renders public live trip tracker with vehicle info, green mobility metrics and map", async () => {
    mockParams = { id: "trip-test-777" };
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTripData),
    } as Response);

    render(<PublicTripTrackerPage />);

    // Initial loading state
    expect(screen.getByText("Connecting to Live Vehicle GPS...")).toBeInTheDocument();

    // After fetch resolves
    await waitFor(() => {
      expect(screen.getByText("Central Station Hub → Downtown Commercial Center")).toBeInTheDocument();
      expect(screen.getByText("Toyota Innova (KA-01-EQ-4491)")).toBeInTheDocument();
      expect(screen.getByText(/Live on Road/i)).toBeInTheDocument();
      expect(screen.getByText("Mocked Live Trip Map")).toBeInTheDocument();
      expect(screen.getByText("Green Mobility & Carbon Counter")).toBeInTheDocument();
    });

    // Verify Green carbon impact calculation (4.0 km * 0.17 = 0.7 kg)
    expect(screen.getByText("0.7 kg")).toBeInTheDocument();
    expect(screen.getByText("1.6 km")).toBeInTheDocument();

    // Test Copy Link button
    const copyButton = screen.getByText("🔗 Copy Link");
    expect(copyButton).toBeInTheDocument();
  });

  it("handles trip not found gracefully with return link", async () => {
    mockParams = { id: "invalid-id" };
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Not found" }),
    } as Response);

    render(<PublicTripTrackerPage />);

    await waitFor(() => {
      expect(screen.getByText("Trip not found or expired.")).toBeInTheDocument();
      expect(screen.getByText("Return to Passenger Portal")).toBeInTheDocument();
    });
  });
});
