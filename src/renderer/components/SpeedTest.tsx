import { useState } from 'react';
import type { SpeedTestResult } from '../types';

function SpeedTest() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SpeedTestResult | null>(null);

  const runTest = async () => {
    setRunning(true);
    setResult(null);
    try {
      const r = await window.netscan.runSpeedTest();
      setResult(r);
    } catch (err) {
      console.error('Speed test failed:', err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="speed-test">
      <div className="section-header">
        <h2>Speed Test</h2>
        <button className="action-btn primary" onClick={runTest} disabled={running}>
          {running ? (
            <><svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" /></svg>Testing...</>
          ) : 'Run Speed Test'}
        </button>
      </div>

      {running && (
        <div className="speed-running pulse">
          <svg className="spin" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          <p>Measuring speed... this may take a moment</p>
        </div>
      )}

      {result && (
        <div className="speed-results fade-in">
          <div className="speed-grid">
            <div className="stat-box">
              <div className="stat-value" style={{ color: 'var(--success)' }}>{result.downloadSpeed}</div>
              <div className="stat-label">Download (Mbps)</div>
            </div>
            <div className="stat-box">
              <div className="stat-value" style={{ color: 'var(--accent)' }}>{result.uploadSpeed}</div>
              <div className="stat-label">Upload (Mbps)</div>
            </div>
            <div className="stat-box">
              <div className="stat-value" style={{ color: 'var(--warning)' }}>{result.ping}</div>
              <div className="stat-label">Ping (ms)</div>
            </div>
          </div>
          <div className="speed-meta">
            Server: {result.server} &bull; {new Date(result.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}

      {!running && !result && (
        <div className="speed-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <p>Click "Run Speed Test" to measure your network speed</p>
        </div>
      )}

      <style>{`
        .speed-test { padding: 20px; height: 100%; overflow-y: auto; }
        .speed-running { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 20px; color: var(--accent); }
        .speed-results { margin-top: 20px; }
        .speed-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .speed-meta { text-align: center; margin-top: 16px; font-size: 12px; color: var(--text-muted); }
        .speed-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60%; gap: 16px; color: var(--text-muted); }
      `}</style>
    </div>
  );
}

export default SpeedTest;
