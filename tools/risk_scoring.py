from sklearn.ensemble import IsolationForest
import pandas as pd


def calculate_ml_score(features_df):
    """
    Train Isolation Forest on engineered features and return anomaly scores.
    """

    X = features_df[
        [
            "transaction_count",
            "total_sent",
            "avg_sent",
            "max_sent",
            "unique_receivers",
            "unique_banks",
            "payment_formats",
            "incoming_count",
            "total_received",
            "avg_received",
            "unique_senders",
        ]
    ]

    model = IsolationForest(
        contamination=0.02,
        random_state=42
    )

    model.fit(X)

    predictions = model.predict(X)

    scores = model.decision_function(X)

    result = features_df.copy()

    result["anomaly"] = predictions
    result["ml_score"] = -scores

    return result


def combine_scores(rule_results, ml_results):
    """
    Combine rule score and ML anomaly score.
    """

    merged = rule_results.merge(
        ml_results,
        left_on="account",
        right_on="Account",
    )

    merged.drop(columns=["Account"], inplace=True)

    max_ml = merged["ml_score"].max()

    min_score = merged["ml_score"].min()
    max_score = merged["ml_score"].max()

    score_range = max_score - min_score

    if score_range == 0:
        merged["ml_score"] = 0
    else:
        merged["ml_score"] = (
            (merged["ml_score"] - min_score)
            / score_range
        ) * 100

    merged["final_score"] = (
        merged["score"] * 0.7
        + merged["ml_score"] * 0.3
    )

    def risk_level(score):
        if score >= 70:
            return "HIGH"
        elif score >= 40:
            return "MEDIUM"
        else:
            return "LOW"

    merged["risk"] = merged["final_score"].apply(risk_level)

    return merged

if __name__ == "__main__":

    from feature_engineering import build_features
    from rule_detection import detect_all_rules

    features = build_features(
        "data/HI-Small_Trans.csv",
        nrows=100000
    )

    rules = detect_all_rules(features)

    results = calculate_ml_score(features)

    final = combine_scores(rules, results)

    print(final.head())
