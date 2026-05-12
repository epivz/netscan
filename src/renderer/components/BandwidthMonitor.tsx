import { useState, useEffect, useRef, useCallback } from 'react';
import type { BandwidthSnapshot } from '../types';

function BandwidthMonitor() {
  const [snapshots, setSnapshots] = useState<BandwidthSnapshot[]>([]);
  const [monitoring, setMonitoring] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B/s`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB/s`;
  };

  const drawGraph = useCallback((data: BandwidthSnapshot[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    if (data.length < 2) return;

    const maxRate = Math.max(...data.map(d => Math.max(d.rxRate, d.txRate)), 1024);
    const stepX = w / (data.length - 1);

    const drawLine = (key: 'rxRate' | 'txRate', color: string) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      data.forEach((d, i) => {
        const x = i * stepX;
        const y = h - (d[key] / maxRate) * (h - 20) - 10;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.lineTo((data.length - 1) * stepX, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = color.replace('1)', '0.1)');
      ctx.fill();
    };

    drawLine('rxRate', 'rgba(76, 223, 139, 1)');
    drawLine('txRate', 'rgba(108, 99, 255, 1)');
  }, []);

  useEffect(() => {
    if (monitoring) {
      const poll = async () => {
        try {
          const snap = await window.netscan.getBandwidth();
          setSnapshots(prev => {
            const next = [...prev, snap].slice(-60);
            drawGraph(next);
            return next;
          });
        } catch { /* ok */ }
      };
      poll();
      intervalRef.current = setInterval(poll, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [monitoring, drawGraph]);

  const latest = snapshots[snapshots.length - 1];

  return (
    <div className="bandwidth">
      <div className="section-header">
        <h2>Bandwidth Monitor</h2>
        <button className="action-btn primary" onClick={() => setMonitoring(!monitoring)}>
          {monitoring ? 'Stop' : 'Start Monitoring'}
        </button>
      </div>

      {latest && (
        <div className="bw-stats">
          <div className="stat-box">
            <div className="stat-value" style={{ color: 'var(--success)' }}>{formatBytes(latest.rxRate)}</div>
            <div className="stat-label">Download</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ color: 'var(--accent)' }}>{formatBytes(latest.txRate)}</div>
            <div className="stat-label">Upload</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{latest.iface}</div>
            <div className="stat-label">Interface</div>
          </div>
        </div>
      )}

      <div className="bw-graph-container">
        <canvas ref={canvasRef} className="bw-canvas" />
        <div className="bw-legend">
          <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--success)' }} /> Download</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent)' }} /> Upload</span>
        </div>
      </div>

      {!monitoring && snapshots.length === 0 && (
        <div className="bw-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
          </svg>
          <p>Click "Start Monitoring" to track bandwidth usage in real time</p>
        </div>
      )}

      <style>{`
        .bandwidth { padding: 20px; height: 100%; display: flex; flex-direction: column; }
        .bw-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
        .bw-graph-container { flex: 1; display: flex; flex-direction: column; min-height: 200px; }
        .bw-canvas { width: 100%; flex: 1; border-radius: var(--radius-lg); background: var(--bg-secondary); border: 1px solid var(--border); }
        .bw-legend { display: flex; gap: 16px; justify-content: center; margin-top: 8px; }
        .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .bw-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 12px; color: var(--text-muted); }
      `}</style>
    </div>
  );
}

export default BandwidthMonitor;
