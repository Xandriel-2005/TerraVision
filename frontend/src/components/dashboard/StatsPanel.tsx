import { useState, useEffect } from 'react';
import { Users, Car, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function StatsPanel() {
  const [stats, setStats] = useState({
    recent_persons: 0,
    recent_vehicles: 0,
    active_alerts: 0
  });

  // Fetch stats periodically
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/analytics/dashboard');
        if (response.ok) {
          const data = await response.json();
          setStats(s => ({
            ...s,
            recent_persons: data.recent_persons,
            recent_vehicles: data.recent_vehicles,
          }));
        }
        
        const alertRes = await fetch('http://localhost:8000/api/alerts/stats');
        if (alertRes.ok) {
          const alertData = await alertRes.json();
          setStats(s => ({
            ...s,
            active_alerts: alertData.unacknowledged
          }));
        }
      } catch (e) {
        console.error("Failed to fetch stats", e);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const statBoxes = [
    { label: 'TRACKED PERSONS', value: stats.recent_persons, icon: Users, color: 'var(--accent-cyan)' },
    { label: 'TRACKED VEHICLES', value: stats.recent_vehicles, icon: Car, color: 'var(--accent-blue)' },
    { label: 'ACTIVE ALERTS', value: stats.active_alerts, icon: ShieldAlert, color: stats.active_alerts > 0 ? 'var(--alert-red)' : 'var(--accent-cyan)' },
    { label: 'THREAT LEVEL', value: stats.active_alerts > 0 ? 'ELEVATED' : 'NOMINAL', icon: AlertTriangle, color: stats.active_alerts > 0 ? 'var(--alert-amber)' : 'var(--accent-cyan)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
      {statBoxes.map((box, idx) => (
        <div key={idx} className="glass-panel" style={{ 
          padding: '1.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderLeft: `4px solid ${box.color}`
        }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
              {box.label}
            </div>
            <div style={{ color: 'var(--text-main)', fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {box.value}
            </div>
          </div>
          <div style={{ 
            backgroundColor: 'rgba(0,0,0,0.2)', 
            padding: '1rem', 
            borderRadius: '50%',
            color: box.color
          }}>
            <box.icon size={24} />
          </div>
        </div>
      ))}
    </div>
  );
}
