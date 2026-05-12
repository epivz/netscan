import { useState, useRef, useEffect, useCallback } from 'react';
import type { PingResult } from '../types';

function PingMonitor() {
  const [host, setHost] = useState('');
  const [pinging, setPinging] = useState(false);
  const [results, setResults] = useState<PingResult[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawGraph = useCallback((data: PingResult[]) => {
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

    const maxTime = Math.max(...data.filter(d => d.alive).map(d => d.time), 10);
    const stepX = w / (data.length - 1);

    ctx.beginPath();
    ctx.strokeStyle = '#4cdf8b';
    ctx.lineWidth = 2;

    data.forEach((d, i) => {
      const x = i * stepX;
      if (!d.alive) return;
      const y = h - (d.time / maxTime) * (h - 20) - 10;
      if (i === 0 || !data[i - 1].alive) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    data.forEach((d, i) => {
      if (!d.alive) {
        const x = i * stepX;
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(x - 2, 0, 4, h);
      }
    });
  }, []);

  useEffect(() => {
    if (pinging && host) {
      let seq = 0;
      const poll = async () => {
        try {
          const r = await window.netscan.pingSingle(host);
          r.seq = seq++;
          setResults(prev => {
            const next = [...prev, r].slice(-120);
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
  }, [pinging, host, drawGraph]);

  const stop = () => { setPinging(false); };
  const start = () => { if (host) { setResults([]); setPinging(true); } };

  const alive = results.filter(r => r.alive);
  const avgTime = alive.length > 0 ? (alive.reduce((s, r) => s + r.time, 0) / alive.length).toFixed(1) : '—';
  const minTime = alive.length > 0 ? Math.min(...alive.map(r => r.time)).toFixed(1) : '—';
  const maxTime = alive.length > 0 ? Math.max(...alive.map(r => r.time)).toFixed(1) : '—';
  const loss = results.length > 0 ? ((results.length - alive.length) / results.length * 100).toFixed(1) : '0';

  return (
    <div className="ping-monitor">
      <div className="section-header">
        <h2>Ping Monitor</h2>
      </div>

      <div className="ping-input-row">
        <input
          className="text-input"
          style={{ flex: 1 }}
          type="text"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="Enter host (e.g. 8.8.8.8 or google.com)"
          onKeyDown={(e) => e.key === 'Enter' && !pinging && start()}
          disabled={pinging}
        />
        <button className="action-btn primary" onClick={pinging ? stop : start} disabled={!host && !pinging}>
          {pinging ? 'Stop' : 'Start Ping'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="ping-stats">
          <div className="stat-box"><div className="stat-value">{avgTime}</div><div className="stat-label">Avg (ms)</div></div>
          <div className="stat-box"><div className="stat-value">{minTime}</div><div className="stat-label">Min (ms)</div></div>
          <div className="stat-box"><div className="stat-value">{maxTime}</div><div className="stat-label">Max (ms)</div></div>
          <div className="stat-box"><div className="stat-value" style={{ color: parseFloat(loss) > 0 ? 'var(--danger)' : 'var(--success)' }}>{loss}%</div><div className="stat-label">Packet Loss</div></div>
        </div>
      )}

      <div className="ping-graph-container">
        <canvas ref={canvasRef} className="ping-canvas" />
      </div>

      {!pinging && results.length === 0 && (
        <div className="ping-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
          </svg>
          <p>Enter a host to start continuous ping monitoring</p>
        </div>
      )}

      <style>{`
        .ping-monitor { padding: 20px; height: 100%; display: flex; flex-direction: column; }
        .ping-input-row { display: flex; gap: 8px; margin-bottom: 16px; }
        .ping-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
        .ping-graph-container { flex: 1; min-height: 150px; }
        .ping-canvas { width: 100%; height: 100%; border-radius: var(--radius-lg); background: var(--bg-secondary); border: 1px solid var(--border); }
        .ping-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 12px; color: var(--text-muted); }
      `}</style>
    </div>
  );
}

export default PingMonitor;
