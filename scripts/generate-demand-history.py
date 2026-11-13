import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Set fixed random seed for reproducibility
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

ZONES = [
    {"slug": "downtown-central", "base_demand": 28.0, "rush_boost": 2.2},
    {"slug": "tech-park-east", "base_demand": 24.0, "rush_boost": 2.5},
    {"slug": "metro-hub-north", "base_demand": 20.0, "rush_boost": 2.0},
    {"slug": "airport-corridor", "base_demand": 16.0, "rush_boost": 1.4},
    {"slug": "residential-south", "base_demand": 14.0, "rush_boost": 1.8},
    {"slug": "university-west", "base_demand": 12.0, "rush_boost": 1.6},
]

def generate_demand_dataset(days=90):
    start_date = datetime(2026, 1, 1, 0, 0, 0)
    intervals_per_day = 96 # 15-minute intervals
    total_intervals = days * intervals_per_day

    timestamps = [start_date + timedelta(minutes=15 * i) for i in range(total_intervals)]
    records = []

    for zone in ZONES:
        slug = zone["slug"]
        base = zone["base_demand"]
        boost = zone["rush_boost"]

        for ts in timestamps:
            hour = ts.hour + ts.minute / 60.0
            day_of_week = ts.weekday()
            is_weekend = 1 if day_of_week >= 5 else 0

            # Diurnal commuting curves
            # Morning rush (8am - 10am)
            morning_peak = np.exp(-((hour - 9.0) ** 2) / (2 * 1.2 ** 2))
            # Evening rush (5pm - 8pm)
            evening_peak = np.exp(-((hour - 18.0) ** 2) / (2 * 1.5 ** 2))
            # Lunch bump (12pm - 2pm)
            lunch_peak = np.exp(-((hour - 13.0) ** 2) / (2 * 1.0 ** 2)) * 0.5

            rush_factor = (morning_peak + evening_peak + lunch_peak) * boost
            weekend_mod = 0.75 if is_weekend else 1.0

            # Baseline pattern + deterministic Gaussian noise
            demand_mean = (base + rush_factor * 12.0) * weekend_mod
            noise = np.random.normal(0, max(1.5, demand_mean * 0.1))
            observed_demand = max(0, int(np.round(demand_mean + noise)))

            records.append({
                "zone_slug": slug,
                "timestamp": ts.isoformat(),
                "hour": ts.hour,
                "quarter": ts.minute // 15,
                "day_of_week": day_of_week,
                "is_weekend": is_weekend,
                "observed_demand": observed_demand,
            })

    df = pd.DataFrame(records)
    # Sort chronologically per zone
    df = df.sort_values(by=["zone_slug", "timestamp"]).reset_index(drop=True)

    # Compute genuine 30-minute ahead target (two 15-minute buckets into future)
    df["target_t_plus_30"] = df.groupby("zone_slug")["observed_demand"].shift(-2)

    # Compute lag features available strictly at prediction time t
    df["lag_1"] = df.groupby("zone_slug")["observed_demand"].shift(1)
    df["lag_2"] = df.groupby("zone_slug")["observed_demand"].shift(2)
    df["rolling_mean_4"] = (
        df.groupby("zone_slug")["observed_demand"]
        .shift(1)
        .rolling(window=4, min_periods=1)
        .mean()
    )

    # Drop rows without complete lag or target history
    clean_df = df.dropna().reset_index(drop=True)
    return clean_df

if __name__ == "__main__":
    print(f"Generating 90-day synthetic demand dataset across 6 zones (Seed={RANDOM_SEED})...")
    df = generate_demand_dataset(days=90)
    output_path = "data/generated/synthetic-demand-history.csv"
    df.to_csv(output_path, index=False)
    print(f"Dataset generated with {len(df)} records. Saved to: {output_path}")

