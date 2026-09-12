import { useState, useEffect } from 'react';
import ZoneEditor from '../components/zones/ZoneEditor';
import { Shield, Plus, Trash2 } from 'lucide-react';
import CameraFeed from '../components/dashboard/CameraFeed';

interface Zone {
  id: string;
  name: string;
  camera_id: string;
  zone_type: string;
  color: string;
}

export default function ZonesPage() {
  const [selectedCamera, setSelectedCamera] = useState('cam-bop-01');
  const [zones, setZones] = useState<Zone[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newZoneName, setNewZoneName] = useState('New Zone');

  const cameras = [
    { id: 'cam-bop-01', name: 'BOP Alpha - Main Gate' },
    { id: 'cam-bop-02', name: 'BOP Alpha - Perimeter' },
    { id: 'cam-bop-03', name: 'BOP Bravo - Checkpoint' },
    { id: 'cam-bop-04', name: 'BOP Bravo - Fence Line' },
  ];

  const fetchZones = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/zones/?camera_id=${selectedCamera}`);
      if (res.ok) {
        const data = await res.json();
        setZones(data);
      }
    } catch (e) {
      console.error("Failed to fetch zones", e);
    }
  };

  useEffect(() => {
    fetchZones();
  }, [selectedCamera]);

  const handleSaveZone = async (points: number[][]) => {
    try {
      const newZone = {
        id: `zone-${Date.now()}`,
        name: newZoneName,
        camera_id: selectedCamera,
        zone_type: 'intrusion',
        polygon_points: points,
        color: '#ef4444',
      };
      
      const res = await fetch('http://localhost:8000/api/zones/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newZone)
      });
      
      if (res.ok) {
        setIsDrawing(false);
        fetchZones();
        setNewZoneName('New Zone');
      }
    } catch (e) {
      console.error("Failed to save zone", e);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      await fetch(`http://localhost:8000/api/zones/${zoneId}`, { method: 'DELETE' });
      fetchZones();
    } catch (e) {
      console.error("Failed to delete zone", e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield className="text-cyan" /> Virtual Fences
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Configure intrusion zones and tripwires.</p>
        </div>
        
        <div>
          <select 
            value={selectedCamera} 
            onChange={e => setSelectedCamera(e.target.value)}
            style={{
              background: 'var(--bg-panel)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              fontFamily: 'var(--font-ui)',
              outline: 'none'
            }}
          >
            {cameras.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        {/* Left column: Feed and drawing area */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
          <div className="glass-panel" style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: '0.5rem' }}>
            <CameraFeed cameraId={selectedCamera} name={cameras.find(c => c.id === selectedCamera)?.name || ''} />
            
            {isDrawing && (
              <div style={{ position: 'absolute', inset: '0.5rem', zIndex: 20 }}>
                <ZoneEditor onSave={handleSaveZone} />
              </div>
            )}
          </div>
          
          {isDrawing && (
            <div style={{ marginTop: '1rem', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }} className="glass-panel">
              <label style={{ fontSize: '0.875rem' }}>Zone Name:</label>
              <input 
                type="text" 
                value={newZoneName} 
                onChange={e => setNewZoneName(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  color: 'white',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)'
                }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginLeft: 'auto' }}>
                Click on the feed to draw polygon vertices.
              </span>
            </div>
          )}
        </div>

        {/* Right column: Zone list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Configured Zones</h3>
            <button 
              className="btn-primary" 
              onClick={() => setIsDrawing(!isDrawing)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={16} /> {isDrawing ? 'Cancel' : 'New Zone'}
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {zones.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No zones configured for this camera.
              </div>
            ) : (
              zones.map(zone => (
                <div key={zone.id} className="glass-panel" style={{ padding: '1rem', borderLeft: `4px solid ${zone.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1rem' }}>{zone.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
                        TYPE: {zone.zone_type.toUpperCase()}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteZone(zone.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--alert-red)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
