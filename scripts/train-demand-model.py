import json
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

RANDOM_SEED = 42

def train_and_export():
    df = pd.read_csv("data/generated/synthetic-demand-history.csv")

    # Chronological holdout split: 70% Train, 15% Validation, 15% Held-out Test
    timestamps = sorted(df["timestamp"].unique())
    n = len(timestamps)
    train_cutoff = timestamps[int(n * 0.70)]
    test_cutoff = timestamps[int(n * 0.85)]

    train_mask = df["timestamp"] < train_cutoff
    test_mask = df["timestamp"] >= test_cutoff

    # Encode zones numerically
    zone_mapping = {slug: i for i, slug in enumerate(sorted(df["zone_slug"].unique()))}
    df["zone_code"] = df["zone_slug"].map(zone_mapping)

    feature_cols = ["zone_code", "hour", "quarter", "day_of_week", "is_weekend", "lag_1", "lag_2", "rolling_mean_4"]
    target_col = "target_t_plus_30"

    X_train = df.loc[train_mask, feature_cols]
    y_train = df.loc[train_mask, target_col]

    X_test = df.loc[test_mask, feature_cols]
    y_test = df.loc[test_mask, target_col]

    print(f"Training HistGradientBoostingRegressor on {len(X_train)} rows; testing on {len(X_test)} chronological holdout rows...")

    model = HistGradientBoostingRegressor(
        random_state=RANDOM_SEED,
        max_iter=150,
        learning_rate=0.08,
        min_samples_leaf=20,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    test_mae = float(mean_absolute_error(y_test, y_pred))
    test_rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))

    # Historical Zone/Time Baseline on same chronological test split
    baseline_lookup = df.loc[train_mask].groupby(["zone_code", "hour", "quarter"])[target_col].mean().to_dict()
    y_baseline = [
        baseline_lookup.get((row["zone_code"], row["hour"], row["quarter"]), y_train.mean())
        for _, row in X_test.iterrows()
    ]
    base_mae = float(mean_absolute_error(y_test, y_baseline))
    base_rmse = float(np.sqrt(mean_squared_error(y_test, y_baseline)))

    print(f"Gradient Boosting Model Test MAE: {test_mae:.4f}, RMSE: {test_rmse:.4f}")
    print(f"Historical Baseline Test MAE: {base_mae:.4f}, RMSE: {base_rmse:.4f}")

    # Generate current forward 30-min forecast sample for each of the 6 zones
    latest_rows = df.groupby("zone_slug").last().reset_index()
    X_latest = latest_rows[feature_cols]
    predictions_30m = model.predict(X_latest)

    zone_forecasts = []
    for i, row in latest_rows.iterrows():
        slug = row["zone_slug"]
        predicted = round(float(predictions_30m[i]), 1)
        actual = int(row["observed_demand"])
        zone_forecasts.append({
            "zoneSlug": slug,
            "forecastHorizonMinutes": 30,
            "predictedDemand": predicted,
            "currentObservedDemand": actual,
            "modelImprovementOverBaselineMae": round(float(base_mae - test_mae), 3),
        })

    artifact = {
        "modelName": "HistGradientBoostingRegressor",
        "modelVersion": "1.0.0",
        "targetHorizonMinutes": 30,
        "isSynthetic": True,
        "randomSeed": RANDOM_SEED,
        "featuresUsed": feature_cols,
        "trainRowCount": len(X_train),
        "testRowCount": len(X_test),
        "splitDates": {
            "trainStart": timestamps[0],
            "trainEnd": train_cutoff,
            "testStart": test_cutoff,
            "testEnd": timestamps[-1],
        },
        "evaluationMetrics": {
            "gradientBoosting": {
                "mae": round(test_mae, 4),
                "rmse": round(test_rmse, 4),
            },
            "historicalBaseline": {
                "mae": round(base_mae, 4),
                "rmse": round(base_rmse, 4),
            },
        },
        "zoneForecasts": zone_forecasts,
        "generatedAt": "2026-11-13T12:00:00Z",
    }

    artifact_path = "data/generated/zone-demand-forecast.json"
    with open(artifact_path, "w") as f:
        json.dump(artifact, f, indent=2)

    print(f"Model forecast artifact exported successfully to: {artifact_path}")

if __name__ == "__main__":
    train_and_export()
