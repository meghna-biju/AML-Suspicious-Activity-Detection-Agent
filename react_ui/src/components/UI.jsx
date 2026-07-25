import React from 'react';

export function RiskBadge({ level }) {
  return <span className={`risk-badge ${level}`}>{level}</span>;
}

export function ActionBadge({ action }) {
  const icons = { report: '🚨', review: '⚠️', monitor: '👁️' };
  return (
    <span className={`action-badge ${action}`}>
      {icons[action] || ''} {action}
    </span>
  );
}

export function ScoreBar({ score, level }) {
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-track">
        <div
          className={`score-bar-fill ${level}`}
          style={{ width: `${Math.round(score * 100)}%` }}
        />
      </div>
      <span className="score-val" style={{
        color: level === 'High' ? 'var(--red)' : level === 'Medium' ? 'var(--amber)' : 'var(--green)'
      }}>
        {Math.round(score * 100)}%
      </span>
    </div>
  );
}

export function Spinner({ size = 20, text }) {
  return (
    <div className="loading-overlay">
      <div className="spinner" style={{ width: size, height: size }} />
      {text && <span>{text}</span>}
    </div>
  );
}

export function MetricCard({ label, value, sub, variant = 'accent', icon }) {
  return (
    <div className={`metric-card ${variant}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">
        {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
        {value}
      </div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

export function Card({ children, className = '', title, icon, action }) {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div className="card-header">
          {title && (
            <div className="card-title">
              {icon && <span className="icon">{icon}</span>}
              {title}
            </div>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function RuleTags({ rules }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {(rules || []).map((r) => (
        <span key={r} className="rule-tag">{r}</span>
      ))}
    </div>
  );
}

export function ToolPills({ invoked = [], skipped = [] }) {
  return (
    <div>
      {invoked.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 800, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            ✅ Invoked Tools
          </div>
          <div className="tool-pills">
            {invoked.map(t => <span key={t} className="tool-pill invoked">{t}</span>)}
          </div>
        </div>
      )}
      {skipped.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            ⏭ Skipped Tools
          </div>
          <div className="tool-pills">
            {skipped.map(t => <span key={t} className="tool-pill skipped">{t}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

/** SVG-based radial gauge for light mode */
export function RiskGauge({ score, level }) {
  const pct = score;
  const radius = 70;
  const circumference = Math.PI * radius; // half circle
  const strokeDashoffset = circumference * (1 - pct);
  const color = level === 'High' ? '#e11d48' : level === 'Medium' ? '#d97706' : '#059669';

  return (
    <div className="gauge-wrap">
      <svg width="180" height="100" viewBox="0 0 180 100" className="gauge-svg" style={{ color }}>
        {/* Track */}
        <path
          d="M 20 90 A 70 70 0 0 1 160 90"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d="M 20 90 A 70 70 0 0 1 160 90"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        {/* Value */}
        <text x="90" y="78" textAnchor="middle" fill={color} fontSize="26" fontWeight="800" fontFamily="'JetBrains Mono', monospace">
          {Math.round(pct * 100)}%
        </text>
        <text x="90" y="96" textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="700">
          RISK SCORE
        </text>
        {/* Tick labels */}
        <text x="14" y="100" fill="var(--text-muted)" fontSize="9" textAnchor="middle" fontWeight="600">0</text>
        <text x="166" y="100" fill="var(--text-muted)" fontSize="9" textAnchor="middle" fontWeight="600">100</text>
      </svg>
      <div className={`risk-badge ${level}`} style={{ fontSize: 12, padding: '4px 14px' }}>
        {level} Risk
      </div>
    </div>
  );
}
