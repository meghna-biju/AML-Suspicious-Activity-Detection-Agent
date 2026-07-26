import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getReport, analyzeQuery } from '../api/client';

const RISK_COLOR = (score) => score >= 0.75 ? 'red' : score >= 0.5 ? 'amber' : 'green';
const RISK_LABEL = (score) => score >= 0.75 ? 'High' : score >= 0.5 ? 'Medium' : 'Low';

// Map entity_id to node position in a small SVG
const NODE_POSITIONS = {
  center: { cx: 220, cy: 200, r: 14 },
  cp1:    { cx: 100, cy: 100, r: 8 },
  cp2:    { cx: 340, cy: 130, r: 8 },
  cp3:    { cx: 130, cy: 310, r: 8 },
  cp4:    { cx: 320, cy: 290, r: 8 },
};

export default function InvestigationPage() {
  const [params] = useSearchParams();
  const entityId = params.get('id') || '100428660';

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('Open');
  const [caseClosed, setCaseClosed] = useState(false);

  useEffect(() => {
    setLoading(true);
    getReport(entityId).then(r => {
      setReport(r);
      setLoading(false);
    });
  }, [entityId]);

  if (loading) return (
    <div className="page-body fade-in" style={{ color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: 12, fontSize: 15 }}>
      <div style={{ width: 16, height: 16, border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Loading case…
    </div>
  );

  const score = report?.risk_score ?? 0;
  const recentTxns = report?.recent_transactions ?? [];

  // Graph counterparties from evidence / rules for visual
  const cpEntries = [
    { key: 'cp1', id: 'CP-1029', risk: 0.72, vol: '₹42k', pos: NODE_POSITIONS.cp1 },
    { key: 'cp2', id: 'CP-9931', risk: 0.88, vol: '₹120k', pos: NODE_POSITIONS.cp2 },
    { key: 'cp3', id: 'CP-4421', risk: 0.12, vol: '₹8k',  pos: NODE_POSITIONS.cp3 },
    { key: 'cp4', id: 'CP-7702', risk: 0.55, vol: '₹35k', pos: NODE_POSITIONS.cp4 },
  ];

  return (
    <div className="page-body fade-in">

      {/* Case Header */}
      <div className="inv-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: 'var(--accent-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(58,91,240,0.12)', padding: '32px 40px', marginBottom: 32, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(58,91,240,0.09) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 8 }}>
            Case — Customer Entity
          </div>
          <div className="inv-title">#{entityId}</div>
          <div className="inv-meta" style={{ marginTop: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Score: {score.toFixed(2)}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>{report?.risk_level} Risk</span>
            <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Status: {status}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Action: <strong style={{ color: 'var(--foreground)' }}>{report?.recommended_action}</strong></span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, position: "relative" }}>

  {!caseClosed && (
    <>
      <button
        className="btn-editorial-primary"
        style={{
          padding: "8px 16px",
          fontSize: 13,
          background: "var(--signal-red)"
        }}
        onClick={() => {
          setStatus("Escalated");
          setCaseClosed(true);
        }}
      >
        Escalate to FIU
      </button>

      <button
        className="btn-editorial-ghost"
        style={{
          padding: "8px 16px",
          fontSize: 13
        }}
        onClick={() => {
          setStatus("Dismissed");
          setCaseClosed(true);
        }}
      >
        Dismiss
      </button>
    </>
  )}

  {caseClosed && (
    <button
      disabled
      className="btn-editorial-primary"
      style={{
        padding: "8px 16px",
        fontSize: 13,
        background:
          status === "Escalated"
            ? "var(--signal-red)"
            : "var(--signal-green)",
        opacity: 0.9,
        cursor: "default"
      }}
    >
      {status === "Escalated"
        ? "✓ Escalated"
        : "✓ Dismissed"}
    </button>
  )}

</div>
      </div>

      {/* AI Summary */}
      {report?.explanation && (
        <div className="ed-card" style={{ marginBottom: 32, borderLeft: '3px solid var(--primary)' }}>
          <div className="ed-card-title">AI Explanation</div>
          <p style={{ fontSize: 15, color: 'var(--ink-secondary)', lineHeight: 1.65 }}>{report.explanation}</p>
          {report.summary && <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginTop: 12, fontStyle: 'italic' }}>{report.summary}</p>}
        </div>
      )}

      {/* 3-Column Body */}
      <div className="inv-body" style={{ marginBottom: 40 }}>

        {/* Left: Profile + Evidence */}
        <div>
          <div className="ed-card-title">Entity Profile</div>
          <ul className="ed-list">
            <li><span>Risk Level</span><span className={`ed-badge ${RISK_COLOR(score)}`}>{report?.risk_level}</span></li>
          </ul>

          {report?.evidence?.length > 0 && (
            <>
              <div className="ed-card-title" style={{ marginTop: 32 }}>Evidence</div>
              {report.evidence.map((ev, i) => (
                <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--hairline)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: ev.type === 'ml' ? 'var(--primary)' : 'var(--signal-amber)', marginBottom: 4 }}>{ev.type === 'ml' ? 'ML Model' : 'Rule'}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.name.replace(/_/g, ' ')}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-secondary)', marginTop: 3 }}>{ev.description}</div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Center: SVG Network Graph */}
        <div className="ed-card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--hairline)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink-muted)' }}>
          Illustrative Transaction Network
          </div>
          <svg viewBox="0 0 440 400" width="100%" height="100%" style={{ display: 'block' }}>
            {/* Grid */}
            <defs>
              <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--hairline)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="440" height="400" fill="url(#grid2)" />

            {/* Edges — all same muted color */}
            {cpEntries.map(cp => (
              <line key={cp.key}
                x1={NODE_POSITIONS.center.cx} y1={NODE_POSITIONS.center.cy}
                x2={cp.pos.cx} y2={cp.pos.cy}
                stroke="var(--ink-muted)"
                strokeWidth={1}
                opacity={0.5}
              />
            ))}

            {/* Counterparty Nodes */}
            {cpEntries.map(cp => (
              <g key={cp.key} style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNode(cp)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <circle cx={cp.pos.cx} cy={cp.pos.cy} r={hoveredNode?.key === cp.key ? cp.pos.r + 3 : cp.pos.r}
                  fill="var(--foreground)"
                  opacity={hoveredNode?.key === cp.key ? 1 : 0.35}
                  style={{ transition: 'all 0.15s ease' }}
                />
                <text x={cp.pos.cx} y={cp.pos.cy + cp.pos.r + 14} fontSize={10} fill="var(--ink-secondary)" textAnchor="middle" fontWeight={500}>{cp.id}</text>
                <title>{cp.id} — Risk: {cp.risk} — Vol: {cp.vol}</title>
              </g>
            ))}

            {/* Center Node — primary accent, no halo */}
            <g style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredNode({ id: `#${entityId}`, risk: score, vol: `₹${(report?.profile?.avg_transaction_amount ?? 0).toLocaleString()}` })} onMouseLeave={() => setHoveredNode(null)}>
              <circle cx={NODE_POSITIONS.center.cx} cy={NODE_POSITIONS.center.cy} r={NODE_POSITIONS.center.r} fill="var(--primary)" />
              <text x={NODE_POSITIONS.center.cx} y={NODE_POSITIONS.center.cy + NODE_POSITIONS.center.r + 16} fontSize={11} fill="var(--foreground)" textAnchor="middle" fontWeight={700}>#{entityId}</text>
            </g>

            {/* Hover tooltip */}
            {hoveredNode && (
              <g>
                <rect x={20} y={340} width={200} height={48} rx={4} fill="var(--foreground)" />
                <text x={32} y={358} fontSize={11} fill="white" fontWeight={700}>{hoveredNode.id}</text>
                <text x={32} y={374} fontSize={10} fill="rgba(255,255,255,0.7)">Risk: {typeof hoveredNode.risk === 'number' ? hoveredNode.risk.toFixed(2) : hoveredNode.risk} · Vol: {hoveredNode.vol}</text>
              </g>
            )}
          </svg>
        </div>

        {/* Right: Transactions Timeline */}
        <div>
          <div className="ed-card-title">Recent Transactions</div>
          <div style={{ position: 'relative', paddingLeft: 16, borderLeft: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16 }}>
            {recentTxns.map((tx, i) => (
              <div key={tx.transaction_id} style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: -21, top: 4, width: 9, height: 9,
                  background: tx.flagged ? 'var(--signal-red)' : 'var(--muted-dark)',
                  borderRadius: '50%', border: '2px solid var(--background)'
                }} />
                <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 2 }}>{tx.date}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{tx.transaction_id}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>₹{tx.amount?.toLocaleString("en-IN")}· {tx.type}</span>
                  {tx.flagged && <span className="ed-badge red">Flagged</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analyst Notes */}
      <div className="ed-card">
        <div className="ed-card-title">Analyst Notes</div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Document your findings here…"
          style={{ width: '100%', minHeight: 80, background: 'transparent', border: '1px solid var(--hairline)', padding: 16, borderRadius: 'var(--radius-md)', fontSize: 14, resize: 'vertical', color: 'var(--foreground)', outline: 'none', fontFamily: 'var(--font-sans)' }}
        />
        <div style={{ display: "flex", gap: 12, position: "relative" }}>

{!caseClosed && (
  <>
    <button
      className="btn-editorial-primary"
      style={{
        padding: "8px 16px",
        fontSize: 13,
        background: "var(--signal-red)"
      }}
      onClick={() => {
        setStatus("Escalated");
        setCaseClosed(true);
      }}
    >
      Escalate to FIU
    </button>

    <button
      className="btn-editorial-ghost"
      style={{
        padding: "8px 16px",
        fontSize: 13
      }}
      onClick={() => {
        setStatus("Dismissed");
        setCaseClosed(true);
      }}
    >
      Dismiss
    </button>
  </>
)}

{caseClosed && (
  <button
    disabled
    className="btn-editorial-primary"
    style={{
      padding: "8px 16px",
      fontSize: 13,
      background:
        status === "Escalated"
          ? "var(--signal-red)"
          : "var(--signal-green)",
      opacity: 0.9,
      cursor: "default"
    }}
  >
    {status === "Escalated"
      ? "✓ Escalated"
      : "✓ Dismissed"}
  </button>
)}

</div>
      </div>
    </div>
  );
}
