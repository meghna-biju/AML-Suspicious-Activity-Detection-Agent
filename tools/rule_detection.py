import pandas as pd

# -----------------------------
# Thresholds
# -----------------------------

HIGH_TXN_COUNT = 10000
HIGH_RECEIVERS = 1000
HIGH_BANKS = 50
HIGH_AVG_AMOUNT = 100000
HIGH_TOTAL_SENT = 50000000


def detect_rules(account):

    rules = []
    score = 0

    # -------------------------
    # Rule 1
    # -------------------------

    if account["transaction_count"] > HIGH_TXN_COUNT:
        rules.append("High Transaction Volume")
        score += 25

    # -------------------------
    # Rule 2
    # -------------------------

    if account["unique_receivers"] > HIGH_RECEIVERS:
        rules.append("Fan-Out Behaviour")
        score += 20

    # -------------------------
    # Rule 3
    # -------------------------

    if account["unique_banks"] > HIGH_BANKS:
        rules.append("High Cross-Bank Activity")
        score += 20

    # -------------------------
    # Rule 4
    # -------------------------

    if account["avg_sent"] > HIGH_AVG_AMOUNT:
        rules.append("Large Average Transfers")
        score += 15

    # -------------------------
    # Rule 5
    # -------------------------

    if account["total_sent"] > HIGH_TOTAL_SENT:
        rules.append("Large Total Outflow")
        score += 20

    # -------------------------
    # Final Risk Level
    # -------------------------

    if score >= 70:
        risk = "HIGH"

    elif score >= 40:
        risk = "MEDIUM"

    else:
        risk = "LOW"

    return {
        "account": account["Account"],
        "score": score,
        "risk": risk,
        "rules": rules
    }


def detect_all_rules(features_df):

    results = []

    for _, row in features_df.iterrows():
        results.append(detect_rules(row))

    return pd.DataFrame(results)


if __name__ == "__main__":

    from feature_engineering import build_features

    features = build_features(
        "data/HI-Small_Trans.csv",
        nrows=100000
    )

    results = detect_all_rules(features)

    print(results.head())