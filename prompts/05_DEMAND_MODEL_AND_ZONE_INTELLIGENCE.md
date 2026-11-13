# Phase 05 — Trained Demand Model and Zone Intelligence

## Objective
Implement the PS2 predictive-demand requirement with an actually trained small model on simulated historical demand, then use the forecasts for zone intelligence, surge estimates and driver repositioning.

## Read first
`docs/01_PRODUCT_REQUIREMENTS.md`, `docs/02_PS2_TRACEABILITY.md`, `docs/08_ALGORITHMS_AND_DEMAND_MODEL.md`, `docs/11_DEMO_AND_SEED_DATA.md`, `docs/14_DECISIONS_AND_LIMITATIONS.md`.

## Non-negotiable distinction
Do not substitute a fixed threshold, random number, or static chart for a trained model. The training data may be simulated, as PS2 allows, but the model must be trained, evaluated, versioned and used to generate forecasts. Clearly label all data and predictions as simulated/prototype outputs.

## Instructions
1. Create the Python training scripts in the agreed `scripts/` area: `generate-demand-history.py`, `train-demand-model.py`, a pinned `requirements.txt` and a short `scripts/README.md`. Use a reproducible random seed and one documented command to generate, train and export.
2. Generate deterministic synthetic demand in 15-minute buckets across at least six zones for 60–90 days (96 buckets/day). Include zone identity, hour-of-day, quarter-hour position, day-of-week/weekend, recent lag features and deterministic noise. Use the target at t+30 minutes as this project's chosen horizon (the PS2 brief does not prescribe a numeric horizon); do not train on hourly targets and call them 15-minute forecasts.
3. Split the data chronologically into training, validation and held-out test periods. Do not randomly shuffle time series across the split.
4. Train a compact GradientBoostingRegressor (or another justified small gradient-boosting implementation) to predict demand 30 minutes ahead from 15-minute interval features. Include at minimum zone, hour, quarter-hour position, weekday, lag-1/lag-2 and a previous-hour rolling mean. A 30-minute target must be built from demand at t+30, using only features available at t.
5. Compare it with a transparent baseline (for example same-zone/time-of-week historical mean). Report MAE and RMSE on the held-out period. Save model metadata and metrics.
6. Export a stable, versioned JSON artifact containing zone, forecast timestamp/window, predicted demand, actual demand where available, model version, training range and evaluation metrics. Validate the file against a schema.
7. Build a forecast display with predicted versus actual demand and a zone heatmap. Distinguish forecasted from observed values and indicate the training data is synthetic.
8. Implement a shared zone-intelligence service that combines forecast demand and available-driver supply. Use it for a clearly labelled simulated surge multiplier and idle-driver repositioning recommendations.
9. Use guardrails: surge multiplier cap, minimum supply floor, no divide-by-zero, no surge in inactive/closed zones, and a human-readable reason for each recommendation.
10. Add a reproducibility command and tests proving that the same seed and inputs generate the same training/evaluation results within expected numeric tolerance.

## Acceptance checks
- A fresh environment can run the training command.
- A fitted model artifact is created; model metadata and test metrics are recorded.
- Model is compared against a baseline on chronological test data.
- Forecast JSON is loaded by the web app through a validated interface.
- Predicted/actual heatmap and forecast window are explicit.
- Zone pricing/repositioning consumes the same forecast-and-supply service.
- Documentation does not imply production-grade prediction or real market pricing.

## Report
Provide training command, dataset generation rules, split dates, model type, baseline, test MAE/RMSE, artifact location and known limitations. Verify that the target timestamp is exactly 30 minutes after the feature timestamp and report this in the artifact. If that horizon was not achieved, state that prominently and correct the scope rather than overclaiming.
