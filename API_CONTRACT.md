# API Contract

---

## POST /analyze

General-purpose endpoint. Takes a natural language query, runs it through the agent, returns results.

**Request**
```json
{
  "query": "Find structuring patterns in the last 30 days"
}
```

**Response**
```json
{
  "query": "Find structuring patterns in the last 30 days",

  "execution_summary": {
    "intent": "structuring_detection",
    "filters": {
      "date_range": "30d",
      "segment": null,
      "country": null,
      "transaction_type": null
    },
    "target_pattern": "structuring",
    "tools_invoked": ["feature_engineering", "rule_detection"],
    "tools_skipped": ["eda", "ml_anomaly_detection"],
    "reasoning": "Query specified a known AML pattern (structuring) and a time filter, so full EDA and ML anomaly detection were skipped in favor of targeted rule-based detection."
  },

  "results": [
    {
      "entity_type": "customer",
      "entity_id": "100428660",
      "risk_score": 0.82,
      "risk_level": "High",
      "triggered_rules": ["structuring_threshold", "high_velocity"],
      "explanation": "Customer 100428660 made 6 transactions between $9,200-$9,800 within a 48-hour window, each just under the $10,000 reporting threshold. This pattern is consistent with structuring. Transaction velocity is 3.2x above this customer's 90-day average.",
      "recommended_action": "report",
      "supporting_data": {
        "transaction_count": 6,
        "total_amount": 56400,
        "window": "48h",
        "avg_transaction_amount": 9400
      }
    }
  ],

  "metrics": {
    "total_entities_scanned": 1250,
    "total_flagged": 14,
    "high_risk_count": 3,
    "medium_risk_count": 6,
    "low_risk_count": 5,
    "processing_time_ms": 842
  },

  "charts_data": {
    "risk_distribution": { "High": 3, "Medium": 6, "Low": 5 },
    "timeline": [
      { "date": "2026-07-01", "flagged_count": 2 },
      { "date": "2026-07-02", "flagged_count": 5 }
    ]
  }
}
```

---

## GET /customer/{id}

Single-entity lookup. Used for queries like "Is customer 100428660 suspicious?"

**Response**
```json
{
  "customer_id": "100428660",
  "risk_score": 0.82,
  "risk_level": "High",
  "triggered_rules": ["structuring_threshold"],
  "explanation": "Customer 100428660 made 6 transactions between $9,200-$9,800 within 48 hours...",
  "recommended_action": "report",
  "profile": {
    "account_age_days": 412,
    "total_transactions": 87,
    "avg_transaction_amount": 3200,
    "flagged_before": true
  },
  "recent_transactions": [
    { "transaction_id": "T10234", "amount": 9500, "date": "2026-07-20", "type": "wire", "flagged": true }
  ]
}
```

---

## POST /chat

Conversational wrapper around /analyze — same core response, plus a natural-language reply string
for the chat bubble.

**Request**
```json
{ "message": "Which customers made 10+ transactions under $10,000?" }
```

**Response**
```json
{
  "reply_text": "I found 8 customers with 10+ transactions under $10,000 in the dataset. Customer 100428660 is the highest risk — flagged for structuring with 14 such transactions in the last 30 days.",
  "analysis": { "...": "same shape as /analyze response above" }
}
```

---

## GET /report/{entity_id}

Full investigation report for a flagged entity — used by the Investigation/Report page.

**Response**
```json
{
  "entity_id": "100428660",
  "entity_type": "customer",
  "risk_level": "High",
  "risk_score": 0.82,
  "summary": "Customer 100428660 shows strong indicators of structuring behavior over the past 30 days.",
  "explanation": "Full detailed explanation text...",
  "recommended_action": "report",
  "evidence": [
    { "type": "rule", "name": "structuring_threshold", "description": "6 transactions under $10,000 within 48h" },
    { "type": "ml", "name": "isolation_forest_anomaly", "description": "Anomaly score 0.79, driven primarily by transaction velocity deviation" }
  ],
  "generated_at": "2026-07-25T14:32:00Z"
}
```

---

## Field notes

- `risk_level` is always one of: `"Low"`, `"Medium"`, `"High"`
- `recommended_action` is always one of: `"monitor"`, `"review"`, `"report"`
- `risk_score` is always a float between 0 and 1
- `tools_invoked` / `tools_skipped` values come from this fixed set: `"eda"`, `"feature_engineering"`, `"rule_detection"`, `"ml_anomaly_detection"`, `"risk_classification"`, `"customer_lookup"`
- All dates: ISO 8601 strings
- `entity_type` is `"customer"` or `"transaction"` depending on query granularity
