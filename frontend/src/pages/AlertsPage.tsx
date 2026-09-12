import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import AlertList from '../components/alerts/AlertList';

interface AlertStats {
  total: number;
  unacknowledged: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
}

export default function AlertsPage() {
  const [stats, setStats] = useState<AlertStats>({
    total: 0,
    unacknowledged: 0,
    by_severity: {},
    by_type: {},
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/alerts/stats');
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (e) {
        console.error('Failed to fetch alert stats', e);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell className="text-cyan" size={22} /> Alerts & Forensics
        </h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Review, filter, and acknowledge security alerts.</p>
      </div>

      {/* Summary Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatBox label="TOTAL EVENTS" value={stats.total} color="var(--accent-cyan)" />
        <StatBox
          label="UNACKNOWLEDGED"
          value={stats.unacknowledged}
          color={stats.unacknowledged > 0 ? 'var(--alert-red)' : 'var(--accent-cyan)'}
          pulse={stats.unacknowledged > 0}
        />
        <StatBox label="HIGH SEVERITY" value={stats.by_severity?.high || 0} color="var(--alert-red)" />
        <StatBox label="ZONE INTRUSIONS" value={stats.by_type?.intrusion || 0} color="var(--alert-amber)" />
      </div>

      {/* Alert list */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <AlertList />
      </div>
    </div>
  );
}

function StatBox({ label, value, color, pulse }: { label: string; value: number | string; color: string; pulse?: boolean }) {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: `4px solid ${color}` }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '0.5rem' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {pulse && (
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}`,
              animation: 'pulse 1.5s infinite',
            }}
          />
        )}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
          {value}
        </span>
      </div>
    </div>
  );
}
