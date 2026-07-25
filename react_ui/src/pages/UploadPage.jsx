import React, { useState, useRef } from 'react';

const MOCK_INGESTS = [
  { id: '1', file: 'transactions_q3.csv', rows: '1.2M', status: 'Completed', time: '10 min ago' },
  { id: '2', file: 'kyc_update_eu.json', rows: '45K', status: 'Completed', time: '1 hr ago' },
  { id: '3', file: 'historical_alerts.xlsx', rows: '12K', status: 'Completed', time: 'Yesterday' },
];

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState('');
  const inputRef = useRef(null);

  const handleSimulate = (e) => {
    e.preventDefault();
    setDragOver(false);
    setToast('Processing dataset. Analysis will begin shortly.');
    setTimeout(() => setToast(''), 4000);
  };

  return (
    <div className="page-body">
      <div className="upload-center">
        {/* Page hero */}
        <div style={{ background: 'var(--accent-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(58,91,240,0.12)', padding: '32px 40px', marginBottom: 40, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(58,91,240,0.09) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 8, position: 'relative' }}>Data Ingestion</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: 1, color: 'var(--foreground)', marginBottom: 8, position: 'relative' }}>Upload transaction data</div>
          <div style={{ fontSize: 14, color: 'var(--ink-secondary)', position: 'relative' }}>Drop a CSV, JSON, XLSX or Parquet file to begin a new analysis run.</div>
        </div>

        {toast && (
          <div style={{ background: 'var(--primary)', color: '#FFF', padding: '12px 20px', borderRadius: 'var(--radius-sm)', marginBottom: 24, fontSize: 13, fontWeight: 500, animation: 'fade-in 0.2s ease' }}>
            {toast}
          </div>
        )}
        
        <div 
          className="ed-card ed-dropzone" 
          style={{ borderColor: dragOver ? 'var(--primary)' : 'var(--ink-muted)', background: dragOver ? 'var(--accent-surface)' : 'transparent' }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleSimulate}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="upload-svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--foreground)', marginBottom: 8 }}>
            Drop datasets for analysis
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-secondary)' }}>
            Supports CSV, JSON, XLSX, and Parquet.
          </div>
          <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={handleSimulate} />
        </div>

        <div className="ed-card" style={{ marginTop: 40 }}>
          <div className="ed-card-title">Recent Ingests</div>
          <table className="ed-table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Rows</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_INGESTS.map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{r.file}</td>
                  <td>{r.rows}</td>
                  <td style={{ color: 'var(--signal-green)' }}>{r.status}</td>
                  <td style={{ color: 'var(--ink-muted)' }}>{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
