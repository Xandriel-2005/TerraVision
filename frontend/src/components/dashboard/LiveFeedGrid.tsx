import React from 'react';
import CameraFeed from './CameraFeed';

export default function LiveFeedGrid() {
  // In a real app, these would come from the API /cameras endpoint
  const cameras = [
    { id: 'cam-bop-01', name: 'BOP Alpha - Main Gate' },
    { id: 'cam-bop-02', name: 'BOP Alpha - Perimeter' },
    { id: 'cam-bop-03', name: 'BOP Bravo - Checkpoint' },
    { id: 'cam-bop-04', name: 'BOP Bravo - Fence Line' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gap: '1rem',
      height: '100%',
      minHeight: '600px'
    }}>
      {cameras.map(cam => (
        <div key={cam.id} className="glass-panel" style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column' }}>
          <CameraFeed cameraId={cam.id} name={cam.name} />
        </div>
      ))}
    </div>
  );
}
