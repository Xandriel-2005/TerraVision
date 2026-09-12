import StatsPanel from '../components/dashboard/StatsPanel';
import LiveFeedGrid from '../components/dashboard/LiveFeedGrid';
import AlertTicker from '../components/dashboard/AlertTicker';

export default function DashboardPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 600 }}>Command Center Overview</h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Live multi-camera tracking and real-time alerts.</p>
      </div>

      <StatsPanel />
      
      <div style={{ flex: 1, minHeight: 0 }}>
        <LiveFeedGrid />
      </div>

      <AlertTicker />
    </div>
  );
}
