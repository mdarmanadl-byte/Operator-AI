"use client";

import { useState } from "react";

const items = [
  { label: "Dashboard", icon: "⌂" },
  { label: "New Task", icon: "⊞" },
  { label: "Task History", icon: "◷" },
  { label: "Analytics", icon: "▥" },
  { label: "Settings", icon: "⚙" },
];

export default function DashboardSidebar() {
  const [active, setActive] = useState("Dashboard");
  return (
    <aside className="dashboard-sidebar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">ϟ</div>
        <div className="brand-copy">
          <div className="brand-name">Operator <span>AI</span></div>
          <div className="brand-subtitle">Autonomous Task Execution</div>
        </div>
      </div>
      <div className="side-label">WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation">
        {items.map((item) => (
          <button
            type="button"
            key={item.label}
            className={`nav-item ${active === item.label ? "active" : ""}`}
            onClick={() => setActive(item.label)}
            title={item.label}
          >
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            <span className="nav-text">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="connection-card">
          <div className="connection-row">
            <span className="connection-icon">●</span>
            <div><strong>Backend</strong><small>API workspace</small></div>
            <span className="status-light" />
          </div>
          <div className="connection-row">
            <span className="connection-icon">◉</span>
            <div><strong>Database</strong><small>Task storage</small></div>
            <span className="status-light" />
          </div>
        </div>
        <div className="sidebar-version"><b>ϟ</b><span>Version 0.1.0</span></div>
      </div>
    </aside>
  );
}
