"""
Sentinel AI — STUB backend.

Returns hardcoded fake data matching API_CONTRACT.md exactly.
Run this so the frontend can be built against a real running server from hour 1.

Later: swap the fake logic inside each endpoint for real calls to your
agent/planner/detection modules. The response SHAPE should stay the same
so the frontend doesn't need to change.

Run:
    pip install fastapi uvicorn
    uvicorn main:app --reload --port 8000

Then hit e.g. http://localhost:8000/docs for interactive testing.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

app = FastAPI(title="Sentinel AI - Stub API")

# Allow Streamlit (or any local frontend) to call this without CORS issues
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    query: str


class ChatRequest(BaseModel):
    message: str


def fake_analyze_response(query: str):
    return {
        "query": query,
        "execution_summary": {
            "intent": "structuring_detection",
            "filters": {
                "date_range": "30d",
                "segment": None,
                "country": None,
                "transaction_type": None,
            },
            "target_pattern": "structuring",
            "tools_invoked": ["feature_engineering", "rule_detection"],
            "tools_skipped": ["eda", "ml_anomaly_detection"],
            "reasoning": (
                "Query specified a known AML pattern (structuring) and a time "
                "filter, so full EDA and ML anomaly detection were skipped in "
                "favor of targeted rule-based detection."
            ),
        },
        "results": [
            {
                "entity_type": "customer",
                "entity_id": "4521",
                "risk_score": 0.82,
                "risk_level": "High",
                "triggered_rules": ["structuring_threshold", "high_velocity"],
                "explanation": (
                    "Customer 4521 made 6 transactions between $9,200-$9,800 "
                    "within a 48-hour window, each just under the $10,000 "
                    "reporting threshold. This pattern is consistent with "
                    "structuring. Transaction velocity is 3.2x above this "
                    "customer's 90-day average."
                ),
                "recommended_action": "report",
                "supporting_data": {
                    "transaction_count": 6,
                    "total_amount": 56400,
                    "window": "48h",
                    "avg_transaction_amount": 9400,
                },
            },
            {
                "entity_type": "customer",
                "entity_id": "3187",
                "risk_score": 0.55,
                "risk_level": "Medium",
                "triggered_rules": ["rapid_cashout"],
                "explanation": (
                    "Customer 3187 received a large deposit followed by a "
                    "transfer-out of 90% of the funds within 18 hours, "
                    "consistent with layering behaviour."
                ),
                "recommended_action": "review",
                "supporting_data": {
                    "transaction_count": 2,
                    "total_amount": 21000,
                    "window": "18h",
                    "avg_transaction_amount": 10500,
                },
            },
        ],
        "metrics": {
            "total_entities_scanned": 1250,
            "total_flagged": 14,
            "high_risk_count": 3,
            "medium_risk_count": 6,
            "low_risk_count": 5,
            "processing_time_ms": 842,
        },
        "charts_data": {
            "risk_distribution": {"High": 3, "Medium": 6, "Low": 5},
            "timeline": [
                {"date": "2026-07-01", "flagged_count": 2},
                {"date": "2026-07-02", "flagged_count": 5},
            ],
        },
    }


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    return fake_analyze_response(req.query)


@app.get("/customer/{customer_id}")
def get_customer(customer_id: str):
    return {
        "customer_id": customer_id,
        "risk_score": 0.82,
        "risk_level": "High",
        "triggered_rules": ["structuring_threshold"],
        "explanation": (
            f"Customer {customer_id} made 6 transactions between $9,200-$9,800 "
            "within 48 hours, consistent with structuring."
        ),
        "recommended_action": "report",
        "profile": {
            "account_age_days": 412,
            "total_transactions": 87,
            "avg_transaction_amount": 3200,
            "flagged_before": True,
        },
        "recent_transactions": [
            {
                "transaction_id": "T10234",
                "amount": 9500,
                "date": "2026-07-20",
                "type": "wire",
                "flagged": True,
            },
            {
                "transaction_id": "T10198",
                "amount": 9300,
                "date": "2026-07-19",
                "type": "wire",
                "flagged": True,
            },
        ],
    }


@app.post("/chat")
def chat(req: ChatRequest):
    analysis = fake_analyze_response(req.message)
    return {
        "reply_text": (
            "I found 8 customers with 10+ transactions under $10,000 in the "
            "dataset. Customer 4521 is the highest risk — flagged for "
            "structuring with 6 such transactions in the last 30 days."
        ),
        "analysis": analysis,
    }


@app.get("/report/{entity_id}")
def report(entity_id: str):
    return {
        "entity_id": entity_id,
        "entity_type": "customer",
        "risk_level": "High",
        "risk_score": 0.82,
        "summary": (
            f"Customer {entity_id} shows strong indicators of structuring "
            "behavior over the past 30 days."
        ),
        "explanation": (
            f"Customer {entity_id} made 6 transactions between $9,200-$9,800 "
            "within a 48-hour window, each just under the $10,000 reporting "
            "threshold, consistent with structuring."
        ),
        "recommended_action": "report",
        "evidence": [
            {
                "type": "rule",
                "name": "structuring_threshold",
                "description": "6 transactions under $10,000 within 48h",
            },
            {
                "type": "ml",
                "name": "isolation_forest_anomaly",
                "description": (
                    "Anomaly score 0.79, driven primarily by transaction "
                    "velocity deviation"
                ),
            },
        ],
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }


@app.get("/")
def root():
    return {"status": "Sentinel AI stub backend running"}