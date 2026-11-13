import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminControlCenter from "@/app/admin/page";

describe("AdminControlCenter DOM & Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockZoneIntelligenceResponse = {
    data: {
      modelMetadata: {
        modelName: "HistGradientBoostingRegressor",
        modelVersion: "1.0.0",
        targetHorizonMinutes: 30,
        isSynthetic: true,
        evaluationMetrics: {
          gradientBoosting: { mae: 2.247, rmse: 3.0008 },
          historicalBaseline: { mae: 3.3189, rmse: 4.2823 },
        },
        generatedAt: "2026-11-13T12:00:00Z",
      },
      zoneIntelligence: [
        {
          zoneSlug: "downtown-central",
          predictedDemand30m: 28.5,
          availableDriversSupply: 12,
          demandSupplyRatio: 2.38,
          simulatedSurgeMultiplier: 1.47,
          repositionRecommendation: {
            needed: true,
            deficit: 16,
            reason: "Forecast demand exceeds current supply.",
          },
        },
      ],
    },
  };

  it("renders operations view with model metadata and zone intelligence table", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockZoneIntelligenceResponse),
    } as Response);

    render(<AdminControlCenter />);

    expect(screen.getByText("Fleet Operations & Dispatch Simulation Lab")).toBeInTheDocument();
    expect(screen.getByText("Trained Demand Model Metadata")).toBeInTheDocument();
    expect(screen.getByText("HistGradientBoostingRegressor (v1.0.0)")).toBeInTheDocument();
    expect(screen.getByText("+1.072 MAE")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("downtown central")).toBeInTheDocument();
      expect(screen.getByText("28.5 reqs")).toBeInTheDocument();
      expect(screen.getByText("Recommend +16 drivers")).toBeInTheDocument();
    });
  });

  it("switches to Simulation Lab tab and executes deterministic simulation run", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url, init) => {
      if (init && init.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                runId: "sim-test-123",
                config: { requestCount: 50, driverCount: 10, seed: 42, maxPickupEtaMinutes: 15 },
                baseline: {
                  assignedCount: 42,
                  totalRequests: 50,
                  completionRatePercent: 84,
                  avgPickupEtaMinutes: 5.2,
                  avgPickupDistanceKm: 1.8,
                  workloadStandardDeviation: 3.4,
                  minTripsPerDriver: 0,
                  maxTripsPerDriver: 9,
                },
                fairRide: {
                  assignedCount: 43,
                  totalRequests: 50,
                  completionRatePercent: 86,
                  avgPickupEtaMinutes: 5.6,
                  avgPickupDistanceKm: 2.0,
                  workloadStandardDeviation: 1.2,
                  minTripsPerDriver: 3,
                  maxTripsPerDriver: 5,
                },
                tradeOffAnalysis: {
                  workloadFairnessGainPercent: 64.7,
                  etaTradeOffMinutes: 0.4,
                  unassignedDelta: -1,
                },
              },
            }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockZoneIntelligenceResponse),
      } as Response);
    });

    render(<AdminControlCenter />);

    // Switch tab
    const simTabBtn = screen.getByRole("button", { name: /Simulation Lab/i });
    fireEvent.click(simTabBtn);

    expect(screen.getByText("Dispatch Simulation Lab Configuration")).toBeInTheDocument();

    // Submit simulation form
    const runBtn = screen.getByRole("button", { name: /Execute Simulation Run/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText("Nearest Eligible Baseline")).toBeInTheDocument();
      expect(screen.getByText("FairRide AI Multi-Factor")).toBeInTheDocument();
      expect(screen.getByText("Trade-off Assessment:")).toBeInTheDocument();
      expect(screen.getByText(/64.7% reduction/)).toBeInTheDocument();
    });
  });
});

