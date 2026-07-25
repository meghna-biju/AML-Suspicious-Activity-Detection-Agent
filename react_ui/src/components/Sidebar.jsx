import React from 'react';
import { NavLink, Link } from 'react-router-dom';

const navItems = [
  { to: '/app',              label: 'Dashboard',    end: true },
  { to: '/app/chat',         label: 'Analyst chat' },
  { to: '/app/analytics',    label: 'Charts & signals' },
  { to: '/app/investigation',label: 'Case detail' },
  { to: '/app/upload',       label: 'Transaction ingest' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link to="/" className="sidebar-logo">
        <div className="logo-icon" aria-hidden="true" />
        <div className="logo-text">Sentinel</div>
      </Link>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={!!end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer session (Removed per request) */}
      <div className="sidebar-footer">
        <div className="session-block">
          <div style={{ color: 'var(--ink-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>System Online</div>
        </div>
      </div>
    </aside>
  );
}
