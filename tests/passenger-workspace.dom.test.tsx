import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PassengerWorkspace from "@/app/passenger/page";

// Mock the dynamic map component for headless DOM testing
vi.mock("@/components/maps/map-wrapper", () => ({
  default: () => <div data-testid="mocked-operations-map">Operations Map Mock</div>,
}));

describe("PassengerWorkspace DOM Component Testing", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders page title, preset pickers, and mocked map surface", () => {
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/api/drivers/nearby")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      } as Response);
    });

    render(<PassengerWorkspace />);

    expect(screen.getByText("Book & Track Rides")).toBeInTheDocument();
    expect(screen.getByLabelText("Pickup Location (Demo Presets)")).toBeInTheDocument();
    expect(screen.getByLabelText("Destination Location (Demo Presets)")).toBeInTheDocument();
    expect(screen.getByTestId("mocked-operations-map")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Request Ride Now/i })).toBeInTheDocument();
  });

  it("renders nearby drivers when fetched via discovery API", async () => {
    const mockNearby = [
      {
        userId: "123e4567-e89b-12d3-a456-426614174099",
        vehicleLabel: "Sedan Horizon",
        lat: 12.972,
        lng: 77.595,
        distanceKm: 0.8,
        estimatedPickupMinutes: 3,
      },
    ];

    vi.spyOn(global, "fetch").mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/api/drivers/nearby")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockNearby }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      } as Response);
    });

    render(<PassengerWorkspace />);

    await waitFor(() => {
      expect(screen.getByText("Sedan Horizon")).toBeInTheDocument();
      expect(screen.getByText("0.8 km away")).toBeInTheDocument();
      expect(screen.getByText("~3m pickup")).toBeInTheDocument();
    });
  });

  it("handles form submission to create a ride request", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation((url, init) => {
      if (init && init.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                id: "ride-dom-1",
                status: "requested",
                pickup_label: "Central Railway Station Hub",
                destination_label: "Downtown Commercial Center",
                distance_km: 3.2,
                fare_estimate: 98,
                trip_eta_minutes: 8,
              },
            }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      } as Response);
    });

    render(<PassengerWorkspace />);

    const submitBtn = screen.getByRole("button", { name: /Request Ride Now/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/rides",
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});
