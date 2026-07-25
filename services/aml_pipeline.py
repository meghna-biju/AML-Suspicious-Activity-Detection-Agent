from pathlib import Path

from tools.feature_engineering import build_features
from tools.rule_detection import detect_all_rules
from tools.risk_scoring import calculate_ml_score, combine_scores

# Cache so the pipeline only runs once
_cached_results = None


def load_pipeline(force_reload=False):
    """
    Runs the AML pipeline and caches the final DataFrame.

    Returns:
        pandas.DataFrame
    """

    global _cached_results

    # Return cached results if already computed
    if _cached_results is not None and not force_reload:
        return _cached_results

    csv_path = (
        Path(__file__).resolve().parent.parent
        / "data"
        / "HI-Small_Trans.csv"
    )

    print("Loading transaction dataset...")

    features = build_features(
        csv_path,
        nrows=100000
    )

    print("Running rule detection...")

    rules = detect_all_rules(features)

    print("Running anomaly detection...")

    ml_scores = calculate_ml_score(features)

    print("Combining scores...")

    final = combine_scores(
        rules,
        ml_scores
    )

    # Cache results
    _cached_results = final

    print(f"Pipeline complete. Loaded {len(final)} accounts.")

    return final


def reload_pipeline():
    """
    Force the pipeline to rebuild.
    Useful if a new CSV is uploaded.
    """
    return load_pipeline(force_reload=True)


if __name__ == "__main__":

    df = load_pipeline()

    print(df.head())

    print("\nColumns:")
    print(df.columns.tolist())

    print("\nRisk Counts:")
    print(df["risk"].value_counts())