import React from 'react';
import { Clock, Wifi, Server, Search } from 'lucide-react';

export default function Header() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { hour12: false });
  const dateString = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <header style={{
      height: '70px',
      backgroundColor: 'var(--bg-panel)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      
      {/* Search / Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: 'rgba(0,0,0,0.3)',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          border: '1px solid rgba(255,255,255,0.1)',
          width: '300px'
        }}>
          <Search size={16} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
          <input 
            type="text" 
            placeholder="Search cameras, zones, events..." 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-main)', 
              outline: 'none',
              width: '100%',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem'
            }} 
          />
        </div>
      </div>

      {/* System Metics */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wifi size={16} className="text-cyan" />
          <span>NET: <span className="text-cyan">99.8%</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Server size={16} className="text-cyan" />
          <span>EDGE GPU: <span className="text-cyan">68°C</span></span>
        </div>
        
        {/* Clock */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'flex-end',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          paddingLeft: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
            <Clock size={16} className="text-cyan" />
            {timeString} IST
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {dateString}
          </div>
        </div>
      </div>
    </header>
  );
}
