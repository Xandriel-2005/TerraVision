import { useState, useRef, useEffect, type MouseEvent } from 'react';

interface Point {
  x: number;
  y: number;
}

interface ZoneEditorProps {
  onSave: (points: number[][]) => void;
  width?: number;
  height?: number;
}

export default function ZoneEditor({ onSave, width = 640, height = 360 }: ZoneEditorProps) {
  const [points, setPoints] = useState<Point[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setPoints([...points, { x, y }]);
  };

  const handleClear = () => setPoints([]);
  
  const handleUndo = () => setPoints(points.slice(0, -1));

  const handleSave = () => {
    if (points.length >= 3) {
      onSave(points.map(p => [Math.round(p.x), Math.round(p.y)]));
      setPoints([]);
    }
  };

  // Render the points on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      // If 3 or more points, draw semi-transparent fill showing the proposed zone
      if (points.length >= 3) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; // alert-red with opacity
        ctx.fill();
        // connect back to start to close shape for visual
        ctx.lineTo(points[0].x, points[0].y);
      }
      
      ctx.strokeStyle = 'var(--alert-red)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw points
      points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.stroke();
      });
    }
  }, [points]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'crosshair',
          border: '2px dashed rgba(255,255,255,0.2)',
          backgroundColor: 'rgba(0,0,0,0.1)'
        }}
      />
      
      <div style={{
        position: 'absolute',
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '0.5rem',
        background: 'rgba(0,0,0,0.8)',
        padding: '0.5rem',
        borderRadius: '8px',
        border: '1px solid var(--border-color)'
      }}>
        <button className="btn-primary" onClick={handleUndo} disabled={points.length === 0}>
          Undo Point
        </button>
        <button className="btn-primary" onClick={handleClear} disabled={points.length === 0}>
          Clear All
        </button>
        <button 
          className="btn-alert" 
          onClick={handleSave} 
          disabled={points.length < 3}
          style={{ padding: '0.5rem 1rem', border: '1px solid var(--alert-red)' }}
        >
          Save Zone
        </button>
      </div>
    </div>
  );
}
