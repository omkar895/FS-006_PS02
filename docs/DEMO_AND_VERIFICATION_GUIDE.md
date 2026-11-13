# FairRide AI — Verification & Demonstration Script

This document provides instructions for developers, reviewers, and judges to verify and test FairRide AI.

---

## 1. Quick Start & Local Execution

### Prerequisites
- Node.js `v20+` or `v24+`
- Python `3.10+` with `scikit-learn`, `numpy`, `pandas` (only if retraining the offline demand model)

### Setup & Run
```bash
# 1. Install dependencies
npm install

# 2. Run automated verification suite (Unit, DOM, ML schemas, State Machine)
npm test

# 3. Verify static type safety
npm run typecheck

# 4. Verify code quality & lint rules
npm run lint

# 5. Production build check
npm run build

# 6. Start production server
npm run start
```
The application will be accessible at `http://localhost:3000`.

---

## 2. 3–5 Minute Judge Walkthrough Guide

### Step 1: Health & System Diagnostics (`/api/health`)
- Visit `http://localhost:3000/api/health`.
- Confirms the Node.js runtime, environment mode, and API status with clean JSON.

### Step 2: Passenger Portal (`/passenger`)
- Select a preset pickup location (e.g. *Downtown Commercial Center*) and destination (*Tech Park East Campus*).
- Observe the **OpenStreetMap Leaflet** map rendering color-coded pins and straight-line estimation.
- Note the live **Nearby Available Drivers Projection** table updating dynamically via `GET /api/drivers/nearby`.
- Click **"Request Ride Now"**:
  - Distance and upfront transparent fare estimate (₹50 base + ₹15/km) are calculated.
  - The request is dispatched using the **FairRide 5-Factor Fairness Engine**.
  - Review the active ride card displaying assigned driver telemetry and real-time state.

### Step 3: Driver Mobile Workspace (`/driver`)
- Open `http://localhost:3000/driver` in a mobile viewport (or narrow window).
- Toggle driver status between `● ONLINE` and `○ OFFLINE`.
- When an offer arrives:
  - Review the prominent offer card displaying pickup location, destination, estimated payout, and pickup ETA.
  - Click **"Accept Ride"**: The ride transitions atomically to `accepted`, and the driver's availability switches to `busy`.
  - Progress through the step-by-step milestones:
    - **"Start Heading to Pickup"** &rarr; status updates to `arriving`.
    - **"Confirm Passenger Picked Up"** &rarr; status updates to `ongoing`.
    - **"Complete Ride & Finalize Fare"** &rarr; status updates to `completed`, final fare is saved, and driver is freed up as `available`.

### Step 4: Admin Control Center & Zone Intelligence (`/admin`)
- Switch to the **Zone Intelligence** tab:
  - Review the **Trained Demand Model Metadata**:
    - Model: `HistGradientBoostingRegressor`
    - Target Horizon: **+30 Minutes**
    - Performance: **MAE = 2.2470** vs. Historical Baseline **3.3189** (+1.072 MAE advantage).
    - Data Provenance badge: *90-Day 15m Synthetic*.
  - Inspect the active zones table: see predicted requests, driver supply, pressure ratio, simulated surge, and repositioning recommendations.

### Step 5: Comparative Dispatch Simulation Lab (`/admin` &rarr; Simulation Lab)
- Switch to the **Simulation Lab** tab.
- Click **"Execute Simulation Run"** (or customize request count, fleet size, seed, max ETA).
- Inspect the side-by-side comparative table:
  - **Nearest Eligible Baseline:** Standard greedy distance assignment with higher workload inequality ($\sigma \approx 3.4$).
  - **FairRide AI Multi-Factor Engine:** Distributes trips equitably, significantly reducing workload standard deviation ($\sigma \approx 1.2$, a $>60\%$ fairness gain).
  - Review the **Trade-off Assessment Bar**: Transparently reports the slight pickup ETA trade-off (e.g. $+0.4\text{ mins}$) required to achieve equitable driver earnings.

---

## 3. Five Mandatory PS2 Capabilities Summary

1. **Predictive Demand Forecasting:** Trained Python `HistGradientBoostingRegressor` on 51,816 intervals, predicting $t+30\text{m}$ horizon, beating historical baseline by 1.072 MAE.
2. **Zone Intelligence & Repositioning:** Demand-to-supply pressure ratio calculates bounded simulated surge ($1.00\times - 3.00\times$) and issues driver reposition recommendations.
3. **Multi-Passenger Ride Pooling:** Evaluates all 4 feasible pickup-before-dropoff route sequences for 2-passenger pools with $\le 1.35\times$ detour and $\le 10\text{m}$ added duration limits, offering 20% fare savings.
4. **Fairness-Aware Allocation:** 5-factor normalized quality scoring (ETA 0.30, Idle 0.25, Distance 0.20, Workload 0.15, Reliability 0.10) with explainable reasoning.
5. **Automatic Reassignment & Exceptions:** Idempotent 3-attempt bounded retry engine handling driver rejections, timeouts, and cancellations while excluding previously tried drivers.

