import pandas as pd


def build_features(csv_path, nrows=None):
    """
    Load transaction dataset and generate account-level features.
    """

    # Load dataset
    df = pd.read_csv(csv_path, nrows=nrows)

    # Parse timestamp
    df["Timestamp"] = pd.to_datetime(df["Timestamp"])

    # ----------------------------
    # Outgoing Features
    # ----------------------------
    outgoing = (
        df.groupby("Account")
        .agg(
            transaction_count=("Account", "count"),
            total_sent=("Amount Paid", "sum"),
            avg_sent=("Amount Paid", "mean"),
            max_sent=("Amount Paid", "max"),
            unique_receivers=("Account.1", "nunique"),
            unique_banks=("To Bank", "nunique"),
            payment_formats=("Payment Format", "nunique"),
            laundering_count=("Is Laundering", "sum"),
        )
    )

    # ----------------------------
    # Incoming Features
    # ----------------------------
    incoming = (
        df.groupby("Account.1")
        .agg(
            incoming_count=("Account.1", "count"),
            total_received=("Amount Received", "sum"),
            avg_received=("Amount Received", "mean"),
            unique_senders=("Account", "nunique"),
        )
    )

    # ----------------------------
    # Merge
    # ----------------------------
    features = outgoing.join(incoming, how="left")

    features.fillna(0, inplace=True)

    features.reset_index(inplace=True)

    return features


if __name__ == "__main__":

    features = build_features(
        "data/HI-Small_Trans.csv",
        nrows=100000
    )

    print(features.head())
    print("\nFeature Shape:", features.shape)