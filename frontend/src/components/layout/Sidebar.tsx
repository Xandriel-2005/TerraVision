import React from 'react';
import { Shield, Activity, Map, Video, Bell } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: Activity },
    { id: 'alerts', label: 'Alerts & Forensics', icon: Bell },
    { id: 'zones', label: 'Virtual Fences', icon: Shield },
    { id: 'map', label: 'GIS Overview', icon: Map },
    { id: 'cameras', label: 'Camera Nodes', icon: Video },
  ];

  return (
    <aside style={{ 
      width: '260px', 
      backgroundColor: 'var(--bg-panel-solid)', 
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--border-glow)'
    }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield style={{ color: 'var(--accent-cyan)' }} />
          <span style={{ fontWeight: 700, letterSpacing: '1px' }}>TerraVision</span>
        </h1>
        <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '2px' }}>
          IBVAP — Sector Alpha
        </div>
      </div>

      <nav style={{ flex: 1, padding: '1rem 0' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {navItems.map(item => {
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  style={{
                    width: '100%',
                    background: isActive ? 'rgba(6, 214, 160, 0.1)' : 'transparent',
                    border: 'none',
                    borderRight: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                    color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                    padding: '1rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 400
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-main)';
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  <item.icon size={18} style={{ color: isActive ? 'var(--accent-cyan)' : 'currentColor' }} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>SYS_STATUS:</span>
          <span className="text-cyan">ONLINE</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>AI_CORE:</span>
          <span className="text-cyan">ACTIVE</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>UPTIME:</span>
          <span>72:14:38</span>
        </div>
      </div>
    </aside>
  );
}
