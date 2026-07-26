import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { analyzeQuery } from "../api/client";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeQuery("show top risky accounts").then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const metrics = data?.metrics;
  const results = data?.results || [];
  const timeline = data?.charts_data?.timeline || [];

  // -------------------------------
  // Build typology mix dynamically
  // -------------------------------

  const typologyCounts = {};

  results.forEach((r) => {
    (r.triggered_rules || []).forEach((rule) => {
      typologyCounts[rule] = (typologyCounts[rule] || 0) + 1;
    });
  });

  const typologies = Object.entries(typologyCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const maxTypology = Math.max(
    ...typologies.map((t) => t.count),
    1
  );

  return (
    <div className="page-body fade-in">

      {/* ---------------- HERO ---------------- */}

      <div className="dash-hero">

        <div className="dash-hero-eyebrow">
          Active Alert Summary
        </div>

        <div
          className="dash-hero-num"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {loading ? "—" : metrics?.total_flagged}
        </div>

        <div className="dash-hero-sub">

          Flagged accounts across{" "}
          {loading
            ? "..."
            : metrics?.total_entities_scanned?.toLocaleString()}

          {metrics?.processing_time_ms && (

            <span
              style={{
                marginLeft: 16,
                fontSize: 13,
                color: "var(--ink-muted)"
              }}
            >
              · processed in {metrics.processing_time_ms} ms
            </span>

          )}

        </div>

      </div>

      {/* ---------------- STATS ---------------- */}

      <div className="stat-grid">

        {[
          {
            label: "High Risk",
            value: loading ? "—" : metrics?.high_risk_count
          },
          {
            label: "Medium Risk",
            value: loading ? "—" : metrics?.medium_risk_count
          },
          {
            label: "Low Risk",
            value: loading ? "—" : metrics?.low_risk_count
          },
          {
            label: "Total Scanned",
            value: loading
              ? "—"
              : metrics?.total_entities_scanned?.toLocaleString()
          }
        ].map(({ label, value }) => (

          <div key={label}>
            <div className="stat-card-val">{value}</div>
            <div className="stat-card-label">{label}</div>
          </div>

        ))}

      </div>

      {/* ---------------- MAIN GRID ---------------- */}

      <div
        className="two-col-layout"
        style={{ gap: 32 }}
      >

        {/* ---------------- TABLE ---------------- */}

        <div className="ed-card">

          <div className="ed-card-title">
            Top Flagged Accounts
          </div>

          {loading ? (

            <div
              style={{
                padding: "24px 0",
                color: "var(--ink-muted)"
              }}
            >
              Loading...
            </div>

          ) : (

            <table className="ed-table">

              <thead>

                <tr>
                  <th>Account</th>
                  <th>Score</th>
                  <th>Risk</th>
                  <th>Triggered Rules</th>
                  <th>Action</th>
                </tr>

              </thead>

              <tbody>

                {results.map((r) => (

                  <tr key={r.entity_id}>

                    <td>

                      <Link
                        to={`/app/investigation?id=${r.entity_id}`}
                        style={{
                          textDecoration: "underline",
                          textUnderlineOffset: 3
                        }}
                      >
                        #{r.entity_id}
                      </Link>

                    </td>

                    <td>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8
                        }}
                      >

                        <div
                          style={{
                            width: 40,
                            height: 4,
                            background: "var(--muted-dark)",
                            borderRadius: 2
                          }}
                        >

                          <div
                            style={{
                              width: `${r.risk_score * 100}%`,
                              height: "100%",
                              background: "var(--primary)",
                              borderRadius: 2
                            }}
                          />

                        </div>

                        {r.risk_score.toFixed(2)}

                      </div>

                    </td>

                    <td>

                      <span
                        className={`ed-badge ${
                          r.risk_level === "HIGH"
                            ? "red"
                            : r.risk_level === "MEDIUM"
                            ? "amber"
                            : "green"
                        }`}
                      >

                        {r.risk_level}

                      </span>

                    </td>

                    <td
                      style={{
                        fontSize: 12
                      }}
                    >

                      {(r.triggered_rules || []).join(", ")}

                    </td>

                    <td
                      style={{
                        color: "var(--primary)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        fontSize: 12
                      }}
                    >

                      {r.recommended_action}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          )}

        </div>

        {/* ---------------- RIGHT SIDE ---------------- */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24
          }}
        >

          {/* Typology */}

          <div className="ed-card">

            <div className="ed-card-title">
            Triggered AML Rules
            </div>

            {typologies.map(({ label, count }) => (

              <div
                key={label}
                className="tiny-meter"
              >

                <div className="tiny-meter-label">
                  {label}
                </div>

                <div className="tiny-meter-track">

                  <div
                    className="tiny-meter-fill"
                    style={{
                      width: `${(count / maxTypology) * 100}%`
                    }}
                  />

                </div>

                <div className="tiny-meter-val">
                  {count}
                </div>

              </div>

            ))}

          </div>

          {/* Timeline */}

          {timeline.length > 0 && (

            <div className="ed-card">

              <div className="ed-card-title">
                7-Day Alert Timeline
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 6,
                  height: 60,
                  marginTop: 8
                }}
              >

                {timeline.map(({ date, flagged_count }) => {

                  const max = Math.max(
                    ...timeline.map((t) => t.flagged_count)
                  );

                  return (

                    <div
                      key={date}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4
                      }}
                    >

                      <div
                        style={{
                          width: "100%",
                          height: `${(flagged_count / max) * 100}%`,
                          background: "var(--primary)",
                          borderRadius: 2,
                          minHeight: 3
                        }}
                      />

                      <div
                        style={{
                          fontSize: 9
                        }}
                      >
                        {date.replace("Jul ", "")}
                      </div>

                    </div>

                  );

                })}

              </div>

            </div>

          )}

          {/* Risk Distribution */}

          {data?.charts_data?.risk_distribution && (

            <div className="ed-card">

              <div className="ed-card-title">
                Risk Distribution
              </div>

              {Object.entries(
                data.charts_data.risk_distribution
              ).map(([level, count]) => (

                <div
                  key={level}
                  className="tiny-meter"
                >

                  <div className="tiny-meter-label">
                    {level}
                  </div>

                  <div className="tiny-meter-track">

                    <div
                      className="tiny-meter-fill"
                      style={{
                        width: `${
                          (count /
                            metrics.total_entities_scanned) *
                          100
                        }%`
                      }}
                    />

                  </div>

                  <div className="tiny-meter-val">
                    {count}
                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}