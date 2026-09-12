import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface AlertCardProps {
  alert: {
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
  };
  onAcknowledge: (id: number) => void;
}

export default function AlertCard({ alert, onAcknowledge }: AlertCardProps) {
  const severityConfig: Record<string, { color: string; icon: typeof AlertCircle; label: string }> = {
    high: { color: 'var(--alert-red)', icon: AlertCircle, label: 'HIGH' },
    medium: { color: 'var(--alert-amber)', icon: AlertTriangle, label: 'MEDIUM' },
    low: { color: 'var(--accent-cyan)', icon: Info, label: 'LOW' },
  };

  const config = severityConfig[alert.severity] || severityConfig.low;
  const Icon = config.icon;
  const time = new Date(alert.timestamp * 1000);

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1rem 1.25rem',
        borderLeft: `4px solid ${config.color}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        opacity: alert.acknowledged ? 0.5 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >
      {/* Severity Icon */}
      <div
        style={{
          backgroundColor: `${config.color}15`,
          padding: '0.6rem',
          borderRadius: '50%',
          flexShrink: 0,
          marginTop: '0.1rem',
        }}
      >
        <Icon size={18} color={config.color} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: config.color,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            {config.label} — {alert.zone_type.replace('_', ' ')}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {time.toLocaleDateString()} {time.toLocaleTimeString()}
          </span>
        </div>

        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.35rem', lineHeight: 1.4 }}>
          {alert.message}
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <span>CAM: {alert.camera_id}</span>
          <span>ZONE: {alert.zone_name}</span>
          <span>TRACK: #{alert.track_id}</span>
          <span>CLASS: {alert.class_name}</span>
        </div>
      </div>

      {/* Acknowledge button */}
      {!alert.acknowledged && (
        <button
          className="btn-primary"
          onClick={() => onAcknowledge(alert.id)}
          style={{ fontSize: '0.7rem', padding: '0.35rem 0.75rem', flexShrink: 0, alignSelf: 'center' }}
        >
          ACK
        </button>
      )}
      {alert.acknowledged && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-cyan)', flexShrink: 0, alignSelf: 'center' }}>
          ✓ ACK
        </span>
      )}
    </div>
  );
}
