import React, { useEffect, useState } from "react";
import { analyzeQuery } from "../api/client";

const HEADER_STATS = [
  { key: "total_flagged", label: "Flagged Accounts" },
  { key: "high_risk_count", label: "High Risk" },
  { key: "medium_risk_count", label: "Medium Risk" },
  { key: "total_entities_scanned", label: "Entities Scanned" },
];

export default function AnalyticsPage() {

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    analyzeQuery("Summarize dataset").then(d => {
      setData(d);
      setLoading(false);
    });

  }, []);

  const metrics = data?.metrics;

  const timeline = data?.charts_data?.timeline || [];

  const riskDist = data?.charts_data?.risk_distribution || {};

  const ruleDist = data?.charts_data?.rule_distribution || {};

  const maxTimeline = Math.max(
    ...timeline.map(t => t.flagged_count),
    1
  );

  const W = 500;
  const H = 180;

  const pts = timeline.map((t, i) => {

    const x =
      (i / Math.max(timeline.length - 1, 1)) * W;

    const y =
      H -
      (t.flagged_count / maxTimeline) *
      (H - 20);

    return { ...t, x, y };

  });

  const linePath = pts
    .map((p, i) =>
      `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`
    )
    .join(" ");

  const areaPath =
    pts.length > 0
      ? `${linePath} L ${W} ${H} L 0 ${H} Z`
      : "";

  return (

    <div className="page-body fade-in">

      {/* HERO */}

      <div
        style={{
          background: "var(--accent-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid rgba(58,91,240,0.12)",
          padding: "32px 40px",
          marginBottom: 40
        }}
      >

        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "var(--primary)"
          }}
        >
          Analytics & Signals
        </div>

        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 38,
            marginTop: 8
          }}
        >
          AML Risk Intelligence Dashboard
        </div>

        <div
          style={{
            marginTop: 10,
            color: "var(--ink-secondary)"
          }}
        >
          Live monitoring of suspicious entities,
          AML rules and risk distribution.
        </div>

      </div>

      {/* METRICS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          marginBottom: 40
        }}
      >

        {HEADER_STATS.map(({ key, label }, i) => (

          <div
            key={key}
            style={{
              padding: "28px 32px",
              borderRight:
                i < 3
                  ? "1px solid var(--hairline)"
                  : "none"
            }}
          >

            <div
              className="result-num"
              style={{ fontSize: 46 }}
            >

              {loading
                ? "—"
                : metrics?.[key]?.toLocaleString()}

            </div>

            <div className="result-label">

              {label}

            </div>

          </div>

        ))}

      </div>

      <div className="two-col-layout">

        {/* Timeline */}

        <div className="ed-card">

          <div className="ed-card-title">

            Daily Flagged Accounts

          </div>

          {timeline.length > 0 ? (

            <svg
              viewBox={`0 0 ${W} ${H + 20}`}
              width="100%"
            >

              <path
                d={areaPath}
                fill="var(--accent-surface)"
              />

              <path
                d={linePath}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
              />

              {pts.map(p => (

                <circle
                  key={p.date}
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="var(--primary)"
                />

              ))}

            </svg>

          ) : (

            <div
              style={{
                color: "var(--ink-muted)"
              }}
            >
              No timeline available.
            </div>

          )}

        </div>

        {/* Risk Distribution */}

        <div className="ed-card">

          <div className="ed-card-title">

            Risk Distribution

          </div>

          <svg
            viewBox="0 0 320 200"
            width="100%"
          >

            <line
              x1="0"
              y1="180"
              x2="320"
              y2="180"
              stroke="var(--hairline)"
            />

            {Object.entries(riskDist).map(
              ([level, count], i) => {

                const max =
                  Math.max(
                    ...Object.values(riskDist),
                    1
                  );

                const h =
                  (count / max) * 160;

                let color =
                  "var(--primary)";

                if (
                  level.toLowerCase() ===
                  "high"
                )
                  color = "#dc2626";

                else if (
                  level.toLowerCase() ===
                  "medium"
                )
                  color = "#f59e0b";

                return (

                  <g key={level}>

                    <rect
                      x={30 + i * 95}
                      y={180 - h}
                      width={50}
                      height={h}
                      fill={color}
                    />

                    <text
                      x={55 + i * 95}
                      y={195}
                      textAnchor="middle"
                      fontSize="10"
                    >
                      {level.toUpperCase()}
                    </text>

                    <text
                      x={55 + i * 95}
                      y={170 - h}
                      textAnchor="middle"
                      fontSize="11"
                    >
                      {count}
                    </text>

                  </g>

                );

              }
            )}

          </svg>

        </div>

      </div>

      {/* RULE DISTRIBUTION */}

      <div
        className="ed-card"
        style={{ marginTop: 40 }}
      >

        <div className="ed-card-title">

          AML Rule Distribution

        </div>

        <table className="ed-table">

          <thead>

            <tr>

              <th>AML Rule</th>

              <th>Flagged Accounts</th>

            </tr>

          </thead>

          <tbody>

            {Object.entries(ruleDist).map(
              ([rule, count]) => (

                <tr key={rule}>

                  <td
                    style={{
                      fontWeight: 600
                    }}
                  >

                    {rule}

                  </td>

                  <td>{count}</td>

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>

    </div>

  );

}