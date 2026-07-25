import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyzeQuery } from '../api/client';

const RISK_COLOR = (score) => {
  if (score >= 0.75) return 'red';
  if (score >= 0.5) return 'amber';
  return 'green';
};

const RISK_LABEL = (score) => {
  if (score >= 0.75) return 'High';
  if (score >= 0.5) return 'Medium';
  return 'Low';
};

const TYPOLOGY_MIX = [
  { label: 'Structuring', pct: 45, color: 'var(--primary)' },
  { label: 'Velocity Burst', pct: 25, color: 'var(--primary)' },
  { label: 'Flow Entropy', pct: 18, color: 'var(--primary)' },
  { label: 'Round Robin', pct: 12, color: 'var(--primary)' },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeQuery('Show all suspicious activities today').then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const metrics = data?.metrics;
  const results = data?.results || [];
  const timeline = data?.charts_data?.timeline || [];

  return (
    <div className="page-body fade-in">

      {/* Hero Strip */}
      <div className="dash-hero">
        <div className="dash-hero-eyebrow">Active Alert Summary</div>
        <div className="dash-hero-num" style={{ fontFamily: 'var(--font-display)' }}>
          {loading ? '—' : metrics?.total_flagged ?? 14}
        </div>
        <div className="dash-hero-sub">
          new alerts across {loading ? '…' : (metrics?.total_entities_scanned?.toLocaleString() ?? '1,250')} entities scanned
          {metrics?.processing_time_ms && (
            <span style={{ marginLeft: 16, fontSize: 13, color: 'var(--ink-muted)', fontFamily: 'var(--font-sans)' }}>
              · processed in {metrics.processing_time_ms}ms
            </span>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {[
          { label: 'High Risk',     value: loading ? '—' : metrics?.high_risk_count ?? 3 },
          { label: 'Medium Risk',   value: loading ? '—' : metrics?.medium_risk_count ?? 6 },
          { label: 'Low Risk',      value: loading ? '—' : metrics?.low_risk_count ?? 5 },
          { label: 'Total Scanned', value: loading ? '—' : metrics?.total_entities_scanned?.toLocaleString() ?? '1,250' },
        ].map(({ label, value }) => (
          <div key={label}>
            <div className="stat-card-val">{value}</div>
            <div className="stat-card-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Two-column grid */}
      <div className="two-col-layout" style={{ gap: 32 }}>

        {/* Recent flagged entities table */}
        <div className="ed-card">
          <div className="ed-card-title">Flagged Entities</div>
          {loading ? (
            <div style={{ color: 'var(--ink-muted)', padding: '24px 0', fontSize: 14 }}>Loading…</div>
          ) : (
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Entity</th>
                  <th>Score</th>
                  <th>Level</th>
                  <th>Rules</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.entity_id}>
                    <td style={{ fontWeight: 600 }}>
                      <Link
                        to={`/app/investigation?id=${r.entity_id}`}
                        style={{ textDecoration: 'underline', textUnderlineOffset: 3, textDecorationColor: 'var(--hairline)' }}
                      >
                        #{r.entity_id}
                      </Link>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 40, height: 4, background: 'var(--muted-dark)', borderRadius: 2 }}>
                          <div style={{ width: `${r.risk_score * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: 2 }} />
                        </div>
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>{r.risk_score.toFixed(2)}</span>
                      </div>
                    </td>
                    <td><span className={`ed-badge ${RISK_COLOR(r.risk_score)}`}>{RISK_LABEL(r.risk_score)}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>{r.triggered_rules?.join(', ')}</td>
                    <td style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{r.recommended_action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Typology mix */}
          <div className="ed-card">
            <div className="ed-card-title">Typology Mix</div>
            {TYPOLOGY_MIX.map(({ label, pct }) => (
              <div key={label} className="tiny-meter">
                <div className="tiny-meter-label">{label}</div>
                <div className="tiny-meter-track">
                  <div className="tiny-meter-fill" style={{ width: `${pct * 2}%` }} />
                </div>
                <div className="tiny-meter-val">{pct}%</div>
              </div>
            ))}
          </div>

          {/* Alert timeline */}
          {timeline.length > 0 && (
            <div className="ed-card">
              <div className="ed-card-title">7-Day Alert Timeline</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60, marginTop: 8 }}>
                {timeline.map(({ date, flagged_count }) => {
                  const maxCount = Math.max(...timeline.map(t => t.flagged_count));
                  const heightPct = (flagged_count / maxCount) * 100;
                  return (
                    <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }} title={`${date}: ${flagged_count} alerts`}>
                      <div style={{ width: '100%', background: 'var(--primary)', borderRadius: 2, height: `${heightPct}%`, minHeight: 3, opacity: 0.7 + (heightPct / 300) }} />
                      <div style={{ fontSize: 9, color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>{date.replace('Jul ', '')}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Risk distribution */}
          {data?.charts_data?.risk_distribution && (
            <div className="ed-card">
              <div className="ed-card-title">Risk Distribution</div>
              {Object.entries(data.charts_data.risk_distribution).map(([level, count]) => (
                <div key={level} className="tiny-meter">
                  <div className="tiny-meter-label">{level}</div>
                  <div className="tiny-meter-track">
                    <div className="tiny-meter-fill" style={{ width: `${(count / (metrics?.total_flagged || 14)) * 100}%` }} />
                  </div>
                  <div className="tiny-meter-val">{count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
