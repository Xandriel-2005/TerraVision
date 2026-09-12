import { useState, useEffect, useCallback } from 'react';
import AlertCard from './AlertCard';

interface AlertData {
  id: number;
  message: string;
  severity: string;
  zone_name: string;
  zone_type: string;
  camera_id: string;
  class_name: string;
  track_id: number;
  timestamp: number;
  acknowledged: boolean;
}

export default function AlertList() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [filter, setFilter] = useState<string>('all'); // all, high, medium, low
  const [showAcknowledged, setShowAcknowledged] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      let url = 'http://localhost:8000/api/alerts/?limit=100';
      if (filter !== 'all') {
        url += `&severity=${filter}`;
      }
      if (!showAcknowledged) {
        url += '&unacknowledged_only=true';
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (e) {
      console.error('Failed to fetch alerts', e);
    }
  }, [filter, showAcknowledged]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleAcknowledge = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/alerts/${id}/acknowledge`, { method: 'PUT' });
      if (res.ok) {
        setAlerts(prev =>
          prev.map(a => (a.id === id ? { ...a, acknowledged: true } : a))
        );
      }
    } catch (e) {
      console.error('Failed to acknowledge alert', e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      {/* Filters */}
      <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>FILTER:</span>
        {['all', 'high', 'medium', 'low'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? 'rgba(6, 214, 160, 0.15)' : 'transparent',
              border: filter === f ? '1px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.1)',
              color: filter === f ? 'var(--accent-cyan-bright)' : 'var(--text-muted)',
              padding: '0.3rem 0.75rem',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
              transition: 'all 0.2s',
            }}
          >
            {f}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <input
              type="checkbox"
              checked={showAcknowledged}
              onChange={e => setShowAcknowledged(e.target.checked)}
              style={{ accentColor: 'var(--accent-cyan)' }}
            />
            SHOW ACK'D
          </label>
        </div>
      </div>

      {/* Alert List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {alerts.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            NO ALERTS MATCHING CURRENT FILTERS
          </div>
        ) : (
          alerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} />
          ))
        )}
      </div>
    </div>
  );
}
