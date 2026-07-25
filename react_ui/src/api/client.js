const BASE_URL = "http://127.0.0.1:8000";

// ── Mock Data (fallback when backend is down) ─────────────────────────────────

const MOCK_ANALYZE = (query) => ({
  query,
  execution_summary: {
    intent: "structuring_detection",
    filters: { date_range: "30d", segment: null, country: null, transaction_type: null },
    target_pattern: "structuring",
    tools_invoked: ["feature_engineering", "rule_detection"],
    tools_skipped: ["eda", "ml_anomaly_detection"],
    reasoning:
      "Query specified a known AML pattern (structuring) and a time filter, so full EDA and ML anomaly detection were skipped in favor of targeted rule-based detection.",
  },
  results: [
    {
      entity_type: "customer",
      entity_id: "4521",
      risk_score: 0.82,
      risk_level: "High",
      triggered_rules: ["structuring_threshold", "high_velocity"],
      explanation:
        "Customer 4521 made 6 transactions between $9,200–$9,800 within a 48-hour window, each just under the $10,000 reporting threshold. This pattern is consistent with structuring. Transaction velocity is 3.2x above the 90-day average.",
      recommended_action: "report",
      supporting_data: { transaction_count: 6, total_amount: 56400, window: "48h", avg_transaction_amount: 9400 },
    },
    {
      entity_type: "customer",
      entity_id: "8932",
      risk_score: 0.55,
      risk_level: "Medium",
      triggered_rules: ["rapid_movement"],
      explanation: "Customer received a large wire and transferred 90% out within 2 hours.",
      recommended_action: "review",
      supporting_data: { transaction_count: 3, total_amount: 48000, window: "2h", avg_transaction_amount: 16000 },
    },
    {
      entity_type: "customer",
      entity_id: "1104",
      risk_score: 0.15,
      risk_level: "Low",
      triggered_rules: ["unusual_location"],
      explanation: "Customer logged in from a new IP, but transaction sizes are normal.",
      recommended_action: "monitor",
      supporting_data: { transaction_count: 1, total_amount: 3200, window: "24h", avg_transaction_amount: 3200 },
    },
    {
      entity_type: "customer",
      entity_id: "3317",
      risk_score: 0.91,
      risk_level: "High",
      triggered_rules: ["smurfing_pattern", "layering"],
      explanation:
        "Customer coordinated with 4 other accounts to split $87,000 into micro-deposits, then funnelled through shell entities.",
      recommended_action: "report",
      supporting_data: { transaction_count: 18, total_amount: 87000, window: "72h", avg_transaction_amount: 4833 },
    },
    {
      entity_type: "customer",
      entity_id: "6602",
      risk_score: 0.67,
      risk_level: "Medium",
      triggered_rules: ["high_velocity", "cross_border"],
      explanation: "Unusual cross-border velocity detected — 9 international transfers in 5 days.",
      recommended_action: "review",
      supporting_data: { transaction_count: 9, total_amount: 72100, window: "5d", avg_transaction_amount: 8011 },
    },
  ],
  metrics: {
    total_entities_scanned: 1250,
    total_flagged: 14,
    high_risk_count: 3,
    medium_risk_count: 6,
    low_risk_count: 5,
    processing_time_ms: 842,
  },
  charts_data: {
    risk_distribution: { High: 3, Medium: 6, Low: 5 },
    timeline: [
      { date: "Jul 19", flagged_count: 1 },
      { date: "Jul 20", flagged_count: 2 },
      { date: "Jul 21", flagged_count: 5 },
      { date: "Jul 22", flagged_count: 1 },
      { date: "Jul 23", flagged_count: 3 },
      { date: "Jul 24", flagged_count: 1 },
      { date: "Jul 25", flagged_count: 2 },
    ],
  },
});

const MOCK_REPORT = (entity_id) => ({
  entity_id,
  entity_type: "customer",
  risk_level: entity_id === "4521" ? "High" : entity_id === "3317" ? "High" : "Medium",
  risk_score: entity_id === "4521" ? 0.82 : entity_id === "3317" ? 0.91 : 0.55,
  summary: `Customer ${entity_id} shows strong indicators of suspicious behavior over the past 30 days.`,
  explanation: `Detailed review of Customer ${entity_id} indicates multiple threshold avoidance techniques. They frequently deposit amounts just below reporting requirements, consistent with structuring patterns outlined in FinCEN guidance.`,
  recommended_action: entity_id === "4521" || entity_id === "3317" ? "report" : "review",
  evidence: [
    { type: "rule", name: "structuring_threshold", description: "6 transactions under $10,000 within 48h" },
    { type: "ml", name: "isolation_forest_anomaly", description: "Anomaly score 0.79, driven primarily by transaction velocity deviation" },
  ],
  profile: {
    account_age_days: 412,
    total_transactions: 87,
    avg_transaction_amount: 3200,
    flagged_before: true,
  },
  recent_transactions: [
    { transaction_id: "T10234", amount: 9500, date: "2026-07-20", type: "wire", flagged: true },
    { transaction_id: "T10201", amount: 9800, date: "2026-07-19", type: "wire", flagged: true },
    { transaction_id: "T10188", amount: 9200, date: "2026-07-18", type: "ach", flagged: true },
    { transaction_id: "T10166", amount: 4300, date: "2026-07-15", type: "deposit", flagged: false },
    { transaction_id: "T10142", amount: 9700, date: "2026-07-12", type: "wire", flagged: true },
  ],
  generated_at: "2026-07-25T14:32:00Z",
});

// ── API Functions ─────────────────────────────────────────────────────────────

async function fetchWithFallback(request, mockFactory) {
  try {
    const res = await request();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    await new Promise((r) => setTimeout(r, 800)); // simulate latency
    return mockFactory();
  }
}

export async function analyzeQuery(query) {
  return fetchWithFallback(
    () => fetch(`${BASE_URL}/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) }),
    () => MOCK_ANALYZE(query)
  );
}

export async function chatQuery(message) {
  return fetchWithFallback(
    () => fetch(`${BASE_URL}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) }),
    () => ({
      reply_text: `I analyzed your request: "${message}". I found 14 flagged entities. Customer 3317 is the highest risk (91%) due to smurfing + layering. Customer 4521 is also high risk (82%) for structuring.`,
      analysis: MOCK_ANALYZE(message),
    })
  );
}

export async function getCustomer(id) {
  return fetchWithFallback(
    () => fetch(`${BASE_URL}/customer/${id}`),
    () => MOCK_REPORT(id)
  );
}

export async function getReport(entity_id) {
  return fetchWithFallback(
    () => fetch(`${BASE_URL}/report/${entity_id}`),
    () => MOCK_REPORT(entity_id)
  );
}
