import re

from services.aml_pipeline import load_pipeline

import time


class AMLPlanner:

    def __init__(self):
        self.data = load_pipeline()

    def refresh(self):
        self.data = load_pipeline(force_reload=True)

    def parse_query(self, query: str):

        q = query.lower()

        if "top" in q and ("risk" in q or "suspicious" in q):
            return "TOP_RISK"

        if "high risk" in q:
            return "HIGH_RISK"

        if "summary" in q or "overview" in q or "statistics" in q:
            return "SUMMARY"

        if "launder" in q:
            return "LAUNDERING"

        if "account" in q:
            return "ACCOUNT_LOOKUP"

        return "GENERAL"

    def build_metrics(self, results):

        risk_counts = self.data["risk"].value_counts()

        return {
            "total_accounts": len(self.data),
            "total_flagged": int(
                len(self.data[self.data["risk"] != "LOW"])
            ),
            "high_risk_count": int(risk_counts.get("HIGH", 0)),
            "medium_risk_count": int(risk_counts.get("MEDIUM", 0)),
            "low_risk_count": int(risk_counts.get("LOW", 0)),
            "returned": len(results)
        }


    def build_chart_data(self):

        risk_counts = self.data["risk"].value_counts()

        return {
            "risk_distribution": {
                "HIGH": int(risk_counts.get("HIGH", 0)),
                "MEDIUM": int(risk_counts.get("MEDIUM", 0)),
                "LOW": int(risk_counts.get("LOW", 0))
            }
        }


    def build_execution_summary(self, intent):

        reasoning = {
            "TOP_RISK": "Detected analyst request for highest-risk accounts. Ranked cached AML results by combined rule and ML score.",
            "HIGH_RISK": "Retrieved all accounts currently classified as HIGH risk.",
            "ACCOUNT_LOOKUP": "Located the requested account in the cached AML dataset.",
            "SUMMARY": "Generated a summary of the AML dataset.",
            "GENERAL": "Returned the highest-ranked suspicious accounts."
        }

        return {
            "intent": intent,
            "tools_invoked": [
                "feature_engineering",
                "rule_detection",
                "risk_scoring"
            ],
            "reasoning": reasoning.get(intent, "Processed analyst query.")
        }

    def extract_account(self, query):

        match = re.search(r"[A-Za-z0-9]{8,}", query)

        if match:
            return match.group()

        return None

    def analyze(self, query):

        start = time.time()
        intent = self.parse_query(query)

        if intent == "TOP_RISK":

            results = (
                self.data
                .sort_values("final_score", ascending=False)
                .head(10)
            )

        elif intent == "HIGH_RISK":

            results = (
                self.data[
                    self.data["risk"] == "HIGH"
                ]
            )

        elif intent == "SUMMARY":

            processing_time_ms = int((time.time() - start) * 1000)

            return {
                "query": query,

                "execution_summary":
                    self.build_execution_summary(intent),

                "results": [],

                "metrics": {
                    **self.build_metrics(self.data),
                    "processing_time_ms": processing_time_ms
                },

                "charts_data":
                    self.build_chart_data()
            }

        elif intent == "ACCOUNT_LOOKUP":

            account = self.extract_account(query)

            if account is None:
                results = self.data.iloc[0:0]

            else:
                results = self.data[
                    self.data["account"] == account
                ]

        else:

            results = (
                self.data
                .sort_values("final_score", ascending=False)
                .head(20)
            )

        processing_time_ms = int((time.time() - start) * 1000)

        return {

            "query": query,

            "execution_summary":
                self.build_execution_summary(intent),

            "results":
                results.to_dict("records"),

            "metrics": {**self.build_metrics(results),
            "processing_time_ms": processing_time_ms },

            "charts_data":
                self.build_chart_data()
        }

    def get_customer(self, account_id: str):
        """
        Return detailed information for a single account.
        """

        account = self.data[
            self.data["account"] == account_id
        ]

        if account.empty:
            return {
                "error": "Account not found"
            }

        row = account.iloc[0]

        recommendation = (
            "Immediate Investigation"
            if row["risk"] == "HIGH"
            else "Manual Review"
            if row["risk"] == "MEDIUM"
            else "Monitor"
        )

        return {
            "account": row["account"],
            "risk_score": round(float(row["final_score"]), 2),
            "risk_level": row["risk"],
            "ml_score": round(float(row["ml_score"]), 2),
            "triggered_rules": row["rules"],

            "summary": (
                f"Account {row['account']} has a "
                f"{row['risk']} risk rating with "
                f"{len(row['rules'])} triggered AML rule(s)."
            ),

            "recommendation": recommendation,

            "profile": {
                "transaction_count": int(row["transaction_count"]),
                "total_sent": float(row["total_sent"]),
                "avg_sent": float(row["avg_sent"]),
                "max_sent": float(row["max_sent"]),
                "incoming_transactions": int(row["incoming_count"]),
                "total_received": float(row["total_received"]),
                "unique_receivers": int(row["unique_receivers"]),
                "unique_banks": int(row["unique_banks"]),
                "laundering_transactions": int(row["laundering_count"])
            }
        }

    def chat(self, message: str):

        analysis = self.analyze(message)

        intent = analysis["execution_summary"]["intent"]

        results = analysis["results"]

        if len(results) == 0:
            reply = (
                "I couldn't find any matching accounts "
                "for your request."
            )

        elif intent == "TOP_RISK":

            top = results[0]

            reply = (
                f"I found {len(results)} high-priority accounts. "
                f"The highest ranked is account {top['account']} "
                f"with a final risk score of "
                f"{top['final_score']:.2f}. "
                f"It triggered the following AML rules: "
                f"{', '.join(top['rules'])}."
            )

        elif intent == "ACCOUNT_LOOKUP":

            acc = results[0]

            reply = (
                f"Account {acc['account']} has a "
                f"{acc['risk']} risk rating "
                f"with a score of "
                f"{acc['final_score']:.2f}."
            )

        elif intent == "SUMMARY":

            m = analysis["metrics"]

            reply = (
                f"The dataset contains "
                f"{m['total_accounts']} accounts. "
                f"{m['total_flagged']} accounts "
                f"have been flagged."
            )

        else:

            reply = (
                f"I found {len(results)} matching accounts."
            )

        return {
            "reply_text": reply,
            "analysis": analysis
        }

    def generate_report(self, account_id: str):
        """
        Generate an investigation report for an account.
        """

        account = self.data[
            self.data["account"] == account_id
        ]

        if account.empty:
            return {
                "error": "Account not found"
            }

        row = account.iloc[0]

        recommendation = (
            "Immediate Investigation"
            if row["risk"] == "HIGH"
            else "Manual Review"
            if row["risk"] == "MEDIUM"
            else "Continue Monitoring"
        )

        evidence = []

        for rule in row["rules"]:
            evidence.append({
                "type": "rule",
                "name": rule,
                "description": f"Triggered AML rule: {rule}"
            })

        evidence.append({
            "type": "ml",
            "name": "Isolation Forest",
            "description": (
                f"ML anomaly score: {round(float(row['ml_score']),2)}"
            )
        })

        return {
            "entity_id": row["account"],
            "entity_type": "account",

            "risk_level": row["risk"],
            "risk_score": round(float(row["final_score"]), 2),

            "summary": (
                f"Account {row['account']} was classified as "
                f"{row['risk']} risk after combining "
                f"rule-based detection and ML anomaly scoring."
            ),

            "explanation": (
                f"The account triggered "
                f"{len(row['rules'])} AML rule(s), "
                f"completed {int(row['transaction_count'])} outgoing transactions, "
                f"and achieved an ML anomaly score of "
                f"{round(float(row['ml_score']),2)}."
            ),

            "recommended_action": recommendation,

            "evidence": evidence
        }

planner = AMLPlanner()

if __name__ == "__main__":

    response = planner.analyze(
        "show top risky accounts"
    )

    print(response)