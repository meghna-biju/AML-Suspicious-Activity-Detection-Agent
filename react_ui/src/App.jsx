import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link, NavLink, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import AnalyticsPage from './pages/AnalyticsPage';
import InvestigationPage from './pages/InvestigationPage';
import UploadPage from './pages/UploadPage';

function AppHeader() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/app/investigation?id=${query.trim()}`);
      setQuery('');
    }
  };

  return (
    <header className="landing-nav" style={{ position: 'sticky', top: 0, padding: '0 40px', zIndex: 100 }}>
      <div className="wordmark" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.8px', fontFamily: 'var(--font-sans)' }}>
        Xcapade
      </div>
      <div className="nav-links">
        <NavLink to="/app" end className={({isActive}) => isActive ? 'active' : ''}>Dashboard</NavLink>
        <NavLink to="/app/chat" className={({isActive}) => isActive ? 'active' : ''}>Analyst chat</NavLink>
        <NavLink to="/app/analytics" className={({isActive}) => isActive ? 'active' : ''}>Charts &amp; signals</NavLink>
        <NavLink to="/app/investigation" className={({isActive}) => isActive ? 'active' : ''}>Case detail</NavLink>
        <NavLink to="/app/upload" className={({isActive}) => isActive ? 'active' : ''}>Transaction ingest</NavLink>
      </div>
      <div className="header-search">
        <input
          type="text"
          placeholder="Search entity ID (e.g. 4521)…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
      </div>
      <Link to="/app/chat" className="btn-editorial-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
        New investigation
      </Link>
    </header>
  );
}

function AppLayout() {
  return (
    <div className="app-shell horizontal-nav-shell">
      <div className="main-content">
        <AppHeader />
        <Routes>
          <Route path="/"              element={<Dashboard />} />
          <Route path="/chat"          element={<ChatPage />} />
          <Route path="/analytics"     element={<AnalyticsPage />} />
          <Route path="/investigation" element={<InvestigationPage />} />
          <Route path="/upload"        element={<UploadPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="/app/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
