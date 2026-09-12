import { useEffect, useRef, useState } from 'react';
import { Map as MapIcon } from 'lucide-react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Simulated BOP locations along Indo-Nepal border for the demo
const DEMO_CAMERAS = [
  { id: 'cam-bop-01', name: 'BOP Alpha - Main Gate', lat: 27.1751, lng: 83.9956, status: 'online' },
  { id: 'cam-bop-02', name: 'BOP Alpha - Perimeter', lat: 27.1758, lng: 83.9971, status: 'online' },
  { id: 'cam-bop-03', name: 'BOP Bravo - Checkpoint', lat: 27.2105, lng: 84.0234, status: 'online' },
  { id: 'cam-bop-04', name: 'BOP Bravo - Fence Line', lat: 27.2112, lng: 84.0249, status: 'alert' },
];

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      // Free OpenStreetMap tile layer
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [83.9956, 27.19], // Indo-Nepal border region
      zoom: 13,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      // Add camera markers
      DEMO_CAMERAS.forEach(cam => {
        const el = document.createElement('div');
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.cursor = 'pointer';
        el.style.boxShadow = cam.status === 'alert'
          ? '0 0 12px rgba(239, 68, 68, 0.8)'
          : '0 0 8px rgba(6, 214, 160, 0.6)';
        el.style.backgroundColor = cam.status === 'alert' ? '#ef4444' : '#06d6a0';

        // Pulse animation for alert cameras
        if (cam.status === 'alert') {
          el.style.animation = 'pulse 1.5s infinite';
        }

        const popup = new maplibregl.Popup({ offset: 20, closeButton: false })
          .setHTML(`
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; padding: 4px;">
              <strong>${cam.name}</strong><br/>
              ID: ${cam.id}<br/>
              Status: <span style="color: ${cam.status === 'alert' ? '#ef4444' : '#06d6a0'}">${cam.status.toUpperCase()}</span>
            </div>
          `);

        new maplibregl.Marker({ element: el })
          .setLngLat([cam.lng, cam.lat])
          .setPopup(popup)
          .addTo(map);

        el.addEventListener('click', () => {
          setSelectedCamera(cam.id);
        });
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapIcon className="text-cyan" size={22} /> GIS Overview
        </h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Geographic view of all camera nodes across Border Out Posts.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        {/* Map */}
        <div className="glass-panel" style={{ flex: 2, overflow: 'hidden', padding: 0 }}>
          <div ref={mapContainer} style={{ width: '100%', height: '100%', minHeight: '500px' }} />
        </div>

        {/* Camera list panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>CAMERA NODES</h3>
          </div>

          {DEMO_CAMERAS.map(cam => (
            <div
              key={cam.id}
              className="glass-panel"
              onClick={() => {
                setSelectedCamera(cam.id);
                mapRef.current?.flyTo({ center: [cam.lng, cam.lat], zoom: 16, speed: 1.2 });
              }}
              style={{
                padding: '1rem',
                cursor: 'pointer',
                borderLeft: `4px solid ${cam.status === 'alert' ? 'var(--alert-red)' : 'var(--accent-cyan)'}`,
                backgroundColor: selectedCamera === cam.id ? 'rgba(6, 214, 160, 0.08)' : undefined,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{cam.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>{cam.id}</span>
                <span style={{ color: cam.status === 'alert' ? 'var(--alert-red)' : 'var(--accent-cyan)' }}>
                  ● {cam.status.toUpperCase()}
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {cam.lat.toFixed(4)}°N, {cam.lng.toFixed(4)}°E
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
