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

        # ---------- Summary ----------
        if re.search(
            r"\b(summary|summarize|summarise|overview|statistics|stats)\b",
            q,
        ):
            return "SUMMARY"

        # ---------- Structuring / Laundering ----------
        if re.search(
            r"\b(structuring|smurfing|launder|money laundering)\b",
            q,
        ):
            return "LAUNDERING"

        # ---------- Threshold Queries ----------
        if (
            "under" in q
            or "below" in q
            or "less than" in q
            or re.search(r"\b\d+\+\b", q)
        ):
            return "THRESHOLD"

        # ---------- Top Risk ----------
        if (
            "top" in q
            and (
                "risk" in q
                or "risky" in q
                or "suspicious" in q
            )
        ):
            return "TOP_RISK"

        # ---------- High Risk ----------
        if (
            "high risk" in q
            or "high-risk" in q
        ):
            return "HIGH_RISK"

        # ---------- Customer Lookup ----------
        if re.search(
            r"\b(?:account|customer)\b",
            q,
        ):
            return "ACCOUNT_LOOKUP"
        aml_keywords = [
            "risk",
            "account",
            "customer",
            "transaction",
            "aml",
            "money",
            "launder",
            "fraud",
            "suspicious",
            "flag",
            "report",
            "transfer",
            "summary",
            "dataset"
        ]

        if any(word in q for word in aml_keywords):
            return "GENERAL"

        return "UNKNOWN"


    def extract_days_filter(self, query):

        m = re.search(r"last\s+(\d+)\s+days?", query.lower())

        if m:
            return int(m.group(1))

        return None

    def extract_threshold(self, query):

        q = query.lower()

        amount = None
        txn_count = None

        m = re.search(r"under\s*\$?\s*([\d,]+)", q)
        if m:
            amount = int(m.group(1).replace(",", ""))

        m = re.search(r"(\d+)\+\s*transactions", q)
        if m:
            txn_count = int(m.group(1))

        return txn_count, amount

    def build_metrics(self, results):

        risk_counts = self.data["risk"].value_counts()

        return {
            "total_accounts": len(self.data),
            "total_entities_scanned": len(self.data),
            "total_flagged": int(
                len(self.data[self.data["risk"] != "LOW"])
            ),
            "high_risk_count": int(risk_counts.get("HIGH", 0)),
            "medium_risk_count": int(risk_counts.get("MEDIUM", 0)),
            "low_risk_count": int(risk_counts.get("LOW", 0)),
            "returned": len(results)
        }


    def build_chart_data(self):

    # -----------------------
    # Risk Distribution
    # -----------------------

        risk_counts = self.data["risk"].value_counts()

        risk_distribution = {
            "HIGH": int(risk_counts.get("HIGH", 0)),
            "MEDIUM": int(risk_counts.get("MEDIUM", 0)),
            "LOW": int(risk_counts.get("LOW", 0))
        }

        # -----------------------
        # Rule Distribution
        # -----------------------

        rule_distribution = {}

        for row in self.data.itertuples():

            for rule in row.rules:

                rule_distribution[rule] = (
                    rule_distribution.get(rule, 0) + 1
                )

        # -----------------------
        # Dummy Timeline
        # -----------------------

        timeline = [
            {"date": "Mon", "flagged_count": 2},
            {"date": "Tue", "flagged_count": 3},
            {"date": "Wed", "flagged_count": 5},
            {"date": "Thu", "flagged_count": 2},
            {"date": "Fri", "flagged_count": 4},
            {"date": "Sat", "flagged_count": 2},
            {"date": "Sun", "flagged_count": 3},
        ]

        return {
            "timeline": timeline,
            "risk_distribution": risk_distribution,
            "rule_distribution": rule_distribution
        }
    
    def build_execution_summary(self, intent, query):

        reasoning = {
            "TOP_RISK": "Detected analyst request for highest-risk accounts. Ranked cached AML results by combined rule and ML score.",
            "HIGH_RISK": "Retrieved all accounts currently classified as HIGH risk.",
            "ACCOUNT_LOOKUP": "Located the requested account in the cached AML dataset.",
            "SUMMARY": "Generated a summary of the AML dataset.",
            "GENERAL": "Returned the highest-ranked suspicious accounts.",
            "LAUNDERING": "Filtered accounts exhibiting suspected money laundering patterns using AML rules.",
            "THRESHOLD": "Applied analyst-specified transaction thresholds to identify matching accounts.",
        }
        days = self.extract_days_filter(query)

        txn_count, amount = self.extract_threshold(query)

        filters = {
            "date_range": f"Last {days} days" if days else None,
            "min_transactions": txn_count,
            "max_amount": amount
        }

        TOOL_MAP = {

            "TOP_RISK": {
                "invoked":[
                    "risk_scoring"
                ],
                "skipped":[
                    "customer_lookup",
                    "eda"
                ]
            },

            "HIGH_RISK": {
                "invoked":[
                    "risk_scoring"
                ],
                "skipped":[
                    "customer_lookup",
                    "eda"
                ]
            },

            "ACCOUNT_LOOKUP":{
                "invoked":[
                    "customer_lookup"
                ],
                "skipped":[
                    "eda",
                    "feature_engineering"
                ]
            },

            "SUMMARY":{
                "invoked":[
                    "eda"
                ],
                "skipped":[
                    "rule_detection",
                    "risk_scoring"
                ]
            },

            "LAUNDERING":{
                "invoked":[
                    "feature_engineering",
                    "rule_detection"
                ],
                "skipped":[
                    "customer_lookup"
                ]
            },

            "THRESHOLD":{
                "invoked":[
                    "feature_engineering",
                    "rule_detection"
                ],
                "skipped":[
                    "eda"
                ]
            },
            }

        tool_info = TOOL_MAP.get(intent, {
            "invoked": [],
            "skipped": []
        })

        return {
            "intent": intent,
            "tools_invoked": tool_info["invoked"],
            "tools_skipped": tool_info["skipped"],
            "reasoning": reasoning.get(intent, "Processed analyst query."),
            "filters": filters
        }

    def extract_account(self, query):

        match = re.search(
            r"(?:account|customer)\s*(?:id)?\s*[:#]?\s*([A-Za-z0-9]+)",
            query,
            re.IGNORECASE
        )

        if match:
            return match.group(1)

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
                    self.build_execution_summary(intent, query),

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

        elif intent == "LAUNDERING":

            results = self.data[self.data["rules"].apply(lambda rules: len(rules) >= 2)]

            results = results.sort_values(
                "final_score",
                ascending=False
            )

        elif intent == "THRESHOLD":

            txn_count, amount = self.extract_threshold(query)

            results = self.data.copy()

            if txn_count is not None:

                results = results[
                    results["transaction_count"] >= txn_count
                ]

            if amount is not None:

                results = results[
                    results["avg_sent"] < amount
                ]

            results = results.sort_values(
                "final_score",
                ascending=False
            )

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
                self.build_execution_summary(intent, query),

            "results":
                self.format_results(results),

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
            "risk_score": round(float(row["final_score"]/100), 2),
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
        msg = message.strip().lower()
        if msg in {
            "hi",
            "hello",
            "hey",
            "good morning",
            "good afternoon",
            "good evening"
        }:
            return {
                "reply_text": (
                    "Hello! What would you like to investigate today?"
                ),
                "analysis": {}
            }

        analysis = self.analyze(message)

        intent = analysis["execution_summary"]["intent"]

        results = analysis["results"]


        # ---------- Summary ----------
        if intent == "SUMMARY":

            m = analysis["metrics"]

            reply = (
                f"Dataset Summary\n\n"
                f"Total Accounts: {m['total_accounts']:,}\n"
                f"Flagged Accounts: {m['total_flagged']:,}\n\n"
                f"HIGH Risk: {m['high_risk_count']}\n"
                f"MEDIUM Risk: {m['medium_risk_count']}\n"
                f"LOW Risk: {m['low_risk_count']}"
            )

        # ---------- No matching results ----------
        elif len(results) == 0:

            reply = (
                "I couldn't find any matching accounts "
                "for your request."
            )

        # ---------- Top Risk ----------
        elif intent == "TOP_RISK":

            top = results[0]

            reply = (
    f"Top Risk Accounts\n\n"
    f"Returned: {len(results)} accounts\n\n"
    f"Highest Risk Account: {top['account']}\n"
    f"Risk Score: {top['final_score']:.2f}\n\n"
    f"Triggered Rules\n"
    f"• " + "\n• ".join(top["triggered_rules"])
)
            

        # ---------- Account Lookup ----------
        elif intent == "ACCOUNT_LOOKUP":

            acc = results[0]

            reply = (
    f"Account: {acc['account']}\n\n"
    f"Risk Level: {acc['risk_level']}\n"
    f"Risk Score: {acc['final_score']:.2f}\n\n"
    f"Triggered Rules\n"
    f"• " + "\n• ".join(acc["triggered_rules"]) +
    f"\n\nRecommended Action\n"
    f"→ {acc['recommended_action']}"
)


        elif intent == "LAUNDERING":

            top = results[0]

            reply = (
            f"I found **{len(results)}** accounts exhibiting potential money laundering indicators.\n\n"
            f"Highest Risk Account: **{top['account']}**\n"
            f"Risk Score: **{top['final_score']:.2f}**\n\n"
            f"Triggered Rules\n"
            f"• " + "\n• ".join(top["triggered_rules"]) + "\n\n"
            f"Recommended Action\n"
            f"→ {top['recommended_action']}"
        )


        elif intent == "THRESHOLD":

            if len(results) == 0:
                reply = (
                    "No accounts matched the specified transaction criteria."
                )

            else:

                top = results[0]

                txn_count, amount = self.extract_threshold(message)

                filters = []

                if txn_count is not None:
                    filters.append(f"Minimum Transactions: {txn_count}")

                if amount is not None:
                    filters.append(f"Maximum Amount: ₹{amount:,}")

                filter_text = "\n".join(filters)

                reply = (
                    f"Transaction Filter Applied\n\n"
                    f"{filter_text}\n\n"
                    f"Found {len(results)} matching accounts.\n\n"
                    f"Highest Risk Account: {top['account']}\n"
                    f"Risk Score: {top['final_score']:.2f}\n"
                    f"Recommended Action: {top['recommended_action']}"
                )

        elif intent == "UNKNOWN":

            reply = (
                "I'm an AML Investigation Assistant and can only answer questions "
                "related to anti-money laundering analysis.\n\n"
            )
        else:

            top = results[0]

            reply = (
                f"Returned {len(results)} suspicious accounts.\n\n"
                f"Highest Risk Account: {top['account']}\n"
                f"Risk Score: {top['final_score']:.2f}"
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
            "risk_score": round(float(row["final_score"]/100), 2),

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

    def format_results(self, results):

        formatted = []

        for _, row in results.iterrows():

            recommendation = (
                "Immediate Investigation"
                if row["risk"] == "HIGH"
                else "Manual Review"
                if row["risk"] == "MEDIUM"
                else "Continue Monitoring"
            )

            formatted.append({
                "entity_id": row["account"],

                # Frontend expects a value between 0 and 1
                "risk_score": round(float(row["final_score"]) / 100, 2),

                "triggered_rules": row["rules"],
                "recommended_action": recommendation,

                # Keep original values too
                "risk_level": row["risk"],
                "final_score": round(float(row["final_score"]), 2),
                "account": row["account"]
            })

        return formatted

planner = AMLPlanner()

if __name__ == "__main__":

    response = planner.analyze(
        "show top risky accounts"
    )

    print(response)