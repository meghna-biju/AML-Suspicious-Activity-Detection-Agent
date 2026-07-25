import React, { useEffect, useState } from 'react';
import { analyzeQuery } from '../api/client';

const HEADER_STATS = [
  { key: 'total_flagged', label: 'Total Flagged' },
  { key: 'high_risk_count', label: 'High Risk' },
  { key: 'medium_risk_count', label: 'Medium Risk' },
  { key: 'total_entities_scanned', label: 'Entities Scanned' },
];

const TYPOLOGIES = [
  { type: 'Structuring', score: '0.88', count: 145, detail: 'Multiple deposits just below reporting threshold' },
  { type: 'Velocity Burst', score: '0.92', count: 82, detail: 'Transaction velocity 3x+ above 90-day baseline' },
  { type: 'Flow Entropy', score: '0.74', count: 56, detail: 'Unusual spread of counterparties relative to volume' },
  { type: 'Round Robin', score: '0.81', count: 41, detail: 'Cyclic fund movement between linked accounts' },
  { type: 'Rapid Movement', score: '0.69', count: 29, detail: '90%+ of received funds transferred within 2hr' },
];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    analyzeQuery('Show analytics and risk distribution').then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const metrics = data?.metrics;
  const timeline = data?.charts_data?.timeline || [];
  const riskDist = data?.charts_data?.risk_distribution;

  const maxTimeline = Math.max(...timeline.map(t => t.flagged_count), 1);

  // Build SVG line path from timeline
  const W = 500, H = 180;
  const pts = timeline.map((t, i) => {
    const x = (i / (timeline.length - 1)) * W;
    const y = H - (t.flagged_count / maxTimeline) * (H - 20);
    return { x, y, ...t };
  });
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = pts.length > 0 ? `${linePath} L ${W} ${H} L 0 ${H} Z` : '';

  return (
    <div className="page-body fade-in">

      {/* Page hero */}
      <div style={{ background: 'var(--accent-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(58,91,240,0.12)', padding: '32px 40px', marginBottom: 40, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(58,91,240,0.09) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 8, position: 'relative' }}>Analytics & Signals</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1, color: 'var(--foreground)', marginBottom: 8, position: 'relative' }}>Risk intelligence overview</div>
        <div style={{ fontSize: 15, color: 'var(--ink-secondary)', position: 'relative' }}>Live metrics and typology breakdown across all scanned entities.</div>
      </div>

      {/* Metric Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 40 }}>
        {HEADER_STATS.map(({ key, label }, i) => (
          <div key={key} style={{ padding: '28px 32px', borderRight: i < 3 ? '1px solid var(--hairline)' : 'none', background: 'var(--background)', transition: 'background 0.2s ease' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--muted)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--background)'}
          >
            <div className="result-num" style={{ fontSize: 48 }}>
              {loading ? '—' : metrics?.[key]?.toLocaleString() ?? '—'}
            </div>
            <div className="result-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="two-col-layout" style={{ marginBottom: 40 }}>

        {/* Line Chart — Timeline */}
        <div className="ed-card">
          <div className="ed-card-title">Alert Volume — 7 Day Timeline</div>
          {loading ? (
            <div style={{ color: 'var(--ink-muted)', padding: '24px 0', fontSize: 14 }}>Loading data…</div>
          ) : (
            <svg viewBox={`0 0 ${W} ${H + 24}`} width="100%" style={{ overflow: 'visible', display: 'block' }}>
              {/* Guide lines */}
              {[0.25, 0.5, 0.75, 1].map(r => (
                <g key={r}>
                  <line x1={0} y1={H - r * (H - 20)} x2={W} y2={H - r * (H - 20)} stroke="var(--hairline)" strokeDasharray="4 4" />
                  <text x={0} y={H - r * (H - 20) - 4} fontSize={8} fill="var(--ink-muted)">{Math.round(r * maxTimeline)}</text>
                </g>
              ))}
              <line x1={0} y1={H} x2={W} y2={H} stroke="var(--hairline)" />

              {/* Area */}
              <path d={areaPath} fill="var(--accent-surface)" opacity={0.5} />
              {/* Line */}
              <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth={1.5} />

              {/* Points */}
              {pts.map((p, i) => (
                <g key={i} style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHovered({ x: p.x, y: p.y, label: `${p.date}: ${p.flagged_count} alerts` })}
                  onMouseLeave={() => setHovered(null)}>
                  <circle cx={p.x} cy={p.y} r={4} fill={hovered?.label?.startsWith(p.date) ? 'var(--signal-red)' : 'var(--primary)'} />
                  <text x={p.x} y={H + 16} fontSize={9} fill="var(--ink-muted)" textAnchor="middle">{p.date}</text>
                  <title>{p.date}: {p.flagged_count} alerts</title>
                </g>
              ))}

              {/* Floating label on hover */}
              {hovered && (
                <g>
                  <rect x={hovered.x - 60} y={hovered.y - 28} width={120} height={22} rx={4} fill="var(--foreground)" />
                  <text x={hovered.x} y={hovered.y - 13} fontSize={10} fill="white" textAnchor="middle">{hovered.label}</text>
                </g>
              )}
            </svg>
          )}
        </div>

        {/* Bar Chart — Risk Distribution */}
        <div className="ed-card">
          <div className="ed-card-title">Risk Distribution</div>
          {!riskDist ? (
            <div style={{ color: 'var(--ink-muted)', padding: '24px 0', fontSize: 14 }}>Loading…</div>
          ) : (
            <svg viewBox="0 0 300 204" width="100%" style={{ overflow: 'visible', display: 'block' }}>
              <line x1={0} y1={180} x2={300} y2={180} stroke="var(--hairline)" />
              {Object.entries(riskDist).map(([level, count], i) => {
                const maxCount = Math.max(...Object.values(riskDist));
                const barH = (count / maxCount) * 160;
                const x = i * 90 + 20;
                const color = 'var(--primary)';
                return (
                  <g key={level} style={{ cursor: 'pointer' }}>
                    <rect x={x} y={180 - barH} width={50} height={barH} fill={color} opacity={0.7} />
                    <text x={x + 25} y={196} fontSize={9} fill="var(--ink-muted)" textAnchor="middle">{level.toUpperCase()}</text>
                    <text x={x + 25} y={180 - barH - 6} fontSize={11} fill="var(--foreground)" textAnchor="middle" fontWeight="600">{count}</text>
                    <title>{level} Risk: {count} entities</title>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>

      {/* Typologies Table */}
      <div className="ed-card">
        <div className="ed-card-title">Typology Breakdown</div>
        <table className="ed-table">
          <thead>
            <tr>
              <th>Typology</th>
              <th>Alert Count</th>
              <th>Mean Score</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {TYPOLOGIES.map(t => (
              <tr key={t.type}>
                <td style={{ fontWeight: 600 }}>{t.type}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>{t.count}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 48, height: 4, background: 'var(--muted-dark)', borderRadius: 2 }}>
                      <div style={{ width: `${parseFloat(t.score) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 13 }}>{t.score}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--ink-secondary)', fontSize: 13 }}>{t.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
