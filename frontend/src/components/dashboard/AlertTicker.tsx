import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';

interface Alert {
  id: number;
  message: string;
  severity: 'high' | 'medium' | 'low';
  camera_id: string;
  timestamp: float;
}

export default function AlertTicker() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { lastMessage } = useWebSocket('ws://localhost:8000/ws/alerts');

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'new_alert') {
      setAlerts(prev => [lastMessage.data, ...prev].slice(0, 5)); // Keep last 5
      
      // Play sound for high severity
      if (lastMessage.data.severity === 'high') {
         // In a real app we would play a sound here
         // const audio = new Audio('/alert.mp3');
         // audio.play();
      }
    }
  }, [lastMessage]);

  if (alerts.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '0.75rem 1.5rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)', marginRight: '1rem' }} />
        <span className="text-mono" style={{ fontSize: '0.875rem' }}>SYSTEM MONITORING ACTIVE - NO RECENT ALERTS</span>
      </div>
    );
  }

  const latestAlert = alerts[0];

  let alertColor = 'var(--accent-cyan)';
  let AlertIcon = Info;
  
  if (latestAlert.severity === 'high') {
    alertColor = 'var(--alert-red)';
    AlertIcon = AlertCircle;
  } else if (latestAlert.severity === 'medium') {
    alertColor = 'var(--alert-amber)';
    AlertIcon = AlertTriangle;
  }

  return (
    <div className="glass-panel" style={{ 
      padding: '0.75rem 1.5rem', 
      marginTop: '1.5rem', 
      display: 'flex', 
      alignItems: 'center',
      borderLeft: `4px solid ${alertColor}`,
      backgroundColor: latestAlert.severity === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-panel)'
    }}>
      <AlertIcon size={20} color={alertColor} style={{ marginRight: '1rem', flexShrink: 0 }} />
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
        <span className="text-mono" style={{ color: alertColor, fontWeight: 700, fontSize: '0.875rem' }}>
          {new Date(latestAlert.timestamp * 1000).toLocaleTimeString()}
        </span>
        <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
          {latestAlert.message}
        </span>
        <span className="text-mono" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          SRC: {latestAlert.camera_id}
        </span>
      </div>

      <button className="btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
        VIEW DETAILS
      </button>
    </div>
  );
}
