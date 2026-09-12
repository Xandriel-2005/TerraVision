import React, { useEffect, useRef } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';

interface CameraFeedProps {
  cameraId: string;
  name: string;
}

export default function CameraFeed({ cameraId, name }: CameraFeedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isConnected, lastMessage } = useWebSocket(`ws://localhost:8000/ws/stream/${cameraId}`);

  useEffect(() => {
    if (lastMessage && lastMessage.frame && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          // Draw image to fill canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = `data:image/jpeg;base64,${lastMessage.frame}`;
      }
    }
  }, [lastMessage]);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: '#000',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid var(--border-color)',
    }}>
      {/* Top Left: Camera Name */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        {name}
        <span style={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isConnected ? 'var(--accent-cyan)' : 'var(--alert-red)'
        }}></span>
      </div>
      
      {/* Top Right: Stats overlay */}
      {lastMessage && lastMessage.stats && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          color: 'var(--accent-cyan)',
          padding: '4px 8px',
          borderRadius: '4px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          zIndex: 10,
        }}>
          FPS: {lastMessage.stats.fps} | P: {lastMessage.stats.person_count} | V: {lastMessage.stats.vehicle_count}
        </div>
      )}

      {/* The Video Canvas */}
      <canvas 
        ref={canvasRef}
        width={640} 
        height={360} 
        className="scanlines"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
}
