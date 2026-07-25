import React, { useState, useRef, useEffect } from 'react';
import { chatQuery } from '../api/client';

const THREAD_DATA = {
  '1': {
    title: 'Structuring — #4521',
    preview: '6 transactions just under $10k threshold…',
    messages: [
      { role: 'agent', text: 'I\'ve loaded the case file for **#4521**. They triggered a structuring alert (Score: 0.82) — 6 transactions between $9,200–$9,800 within 48 hours, each just under the $10,000 reporting threshold. How would you like to proceed?' },
      { role: 'user',  text: 'Are there any shared counterparties with known high-risk entities?' },
      { role: 'agent', text: 'Yes. #4521 shares **3 counterparties** with a cluster previously flagged for smurfing+layering in Q2 (specifically #3317\'s network). Velocity of deposits to these shared counterparties increased by 400% in the last 72 hours. Recommended action: **Report** to FinCEN.' },
    ],
  },
  '2': {
    title: 'Smurfing+Layering — #3317',
    preview: 'Coordinated with 4 shell accounts…',
    messages: [
      { role: 'agent', text: 'Case **#3317** flagged for smurfing and layering (Score: 0.91). Funds were split across **4 shell accounts**, each receiving deposits under the reporting threshold, then consolidated into a single offshore account within 6 hours.' },
      { role: 'user',  text: 'What jurisdictions are the shell accounts registered in?' },
      { role: 'agent', text: 'Two accounts are registered in the **Cayman Islands**, one in **Malta**, and one in **Cyprus** — all high-risk jurisdictions per FATF guidance. Combined outbound volume: **€2.4M** over 14 days. Recommended action: **Escalate** to FIU immediately.' },
    ],
  },
  '3': {
    title: 'Rapid Movement — #8932',
    preview: '90% of received wire moved within 2hr…',
    messages: [
      { role: 'agent', text: '**#8932** shows rapid fund movement (Score: 0.79). Over 90% of incoming wire transfers are re-transmitted to third parties within 2 hours — a strong indicator of pass-through activity consistent with money mule behaviour.' },
      { role: 'user',  text: 'How long has this pattern been active?' },
      { role: 'agent', text: 'The pattern has been active for **23 days**, beginning July 2nd. In total, **$840,000** has transited this account with minimal retained balance (avg ending balance: $420). Recommended action: **Review** and file SAR.' },
    ],
  },
  '4': {
    title: 'Cross-border Velocity — #6602',
    preview: '9 international transfers in 5 days…',
    messages: [
      { role: 'agent', text: '**#6602** triggered a cross-border velocity alert (Score: 0.74). Nine international wire transfers across 6 different countries were executed within 5 days — far exceeding the 90-day baseline of 1 cross-border transfer per month.' },
      { role: 'user',  text: 'Which countries were involved?' },
      { role: 'agent', text: 'Transfers span **UAE, Turkey, Nigeria, Hong Kong, Panama, and the UK**. Three of those jurisdictions carry elevated FATF risk ratings. Total volume: **$310,000**. Recommended action: **Review** for potential sanctions exposure.' },
    ],
  },
  '5': {
    title: 'Unusual Location — #1104',
    preview: 'New IP login, normal transaction size…',
    messages: [
      { role: 'agent', text: '**#1104** flagged for geolocation anomaly (Score: 0.61). Account authenticated from a new IP in **Lagos, Nigeria** — 8,400 km from the account holder\'s registered address in Lyon, France. Transaction sizes appear normal but context is suspicious.' },
      { role: 'user',  text: 'Has this IP been associated with other suspicious accounts?' },
      { role: 'agent', text: 'Yes — this IP appears in **2 other flagged accounts** from last quarter (both filed SARs). It\'s linked to a known VPN exit node used in previous account takeover cases. Recommended action: **Freeze** account pending customer verification.' },
    ],
  },
};

function renderText(t) {
  return t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

export default function ChatPage() {
  const [activeThread, setActiveThread] = useState('1');
  const [threadMessages, setThreadMessages] = useState(() => {
    const init = {};
    Object.keys(THREAD_DATA).forEach(id => { init[id] = [...THREAD_DATA[id].messages]; });
    return init;
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const messages = threadMessages[activeThread] || [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, activeThread]);

  const switchThread = (id) => {
    setActiveThread(id);
    setInput('');
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setThreadMessages(prev => ({
      ...prev,
      [activeThread]: [...(prev[activeThread] || []), { role: 'user', text }],
    }));
    setLoading(true);
    try {
      const res = await chatQuery(text);
      const reply = res?.reply_text ?? 'I analyzed your request and found relevant patterns. Please check the investigation page for details.';
      setThreadMessages(prev => ({
        ...prev,
        [activeThread]: [...(prev[activeThread] || []), { role: 'agent', text: reply }],
      }));
    } catch {
      setThreadMessages(prev => ({
        ...prev,
        [activeThread]: [...(prev[activeThread] || []), { role: 'agent', text: 'Unable to reach the backend. Please ensure the API server is running at http://127.0.0.1:8000.' }],
      }));
    }
    setLoading(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="chat-layout">
      {/* Thread Sidebar */}
      <div className="chat-sidebar">
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: '#0E0E0E' }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, color: '#fff', marginBottom: 2 }}>Analyst Chat</div>
          <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.4)' }}>Active Cases</div>
        </div>
        {Object.entries(THREAD_DATA).map(([id, thread]) => (
          <div
            key={id}
            className={`thread-item${id === activeThread ? ' active' : ''}`}
            onClick={() => switchThread(id)}
          >
            <div className="thread-title">{thread.title}</div>
            <div className="thread-preview">{thread.preview}</div>
          </div>
        ))}
      </div>

      {/* Conversation */}
      <div className="chat-main">
        {/* Case header */}
        <div style={{ padding: '14px 40px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--background)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>{THREAD_DATA[activeThread]?.title}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>· {messages.length} messages</div>
        </div>

        <div className="chat-history">
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role}`}>
              {m.role === 'agent' && (
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink-muted)', marginBottom: 8 }}>
                  Xcapade Agent
                </div>
              )}
              <div
                className="msg-content"
                dangerouslySetInnerHTML={{ __html: renderText(m.text) }}
              />
            </div>
          ))}
          {loading && (
            <div className="chat-msg agent">
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink-muted)', marginBottom: 8 }}>AML Guard Agent</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1s infinite' }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1s 0.2s infinite' }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1s 0.4s infinite' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-area">
          <div className="chat-input-box">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={`Ask about ${THREAD_DATA[activeThread]?.title}…`}
              disabled={loading}
            />
            <div className="chat-input-footer">
              <span className="chat-input-hint">Enter to send · Shift+Enter for newline</span>
              <button
                className="btn-editorial-primary"
                style={{ padding: '8px 20px', fontSize: 13, opacity: loading ? 0.6 : 1 }}
                onClick={send}
                disabled={loading}
              >
                {loading ? 'Thinking…' : 'Send message'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
