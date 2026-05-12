import { useState } from 'react';
import type { TracerouteHop } from '../types';

function Traceroute() {
  const [host, setHost] = useState('');
  const [running, setRunning] = useState(false);
  const [hops, setHops] = useState<TracerouteHop[]>([]);

  const runTrace = async () => {
    if (!host) return;
    setRunning(true);
    setHops([]);
    try {
      const results = await window.netscan.runTraceroute(host);
      setHops(results);
    } catch (err) {
      console.error('Traceroute failed:', err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="traceroute">
      <div className="section-header">
        <h2>Traceroute</h2>
      </div>

      <div className="trace-input-row">
        <input
          className="text-input"
          style={{ flex: 1 }}
          type="text"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="Enter hostname or IP (e.g. google.com)"
          onKeyDown={(e) => e.key === 'Enter' && runTrace()}
        />
        <button className="action-btn primary" onClick={runTrace} disabled={running || !host}>
          {running ? 'Tracing...' : 'Trace Route'}
        </button>
      </div>

      {running && (
        <div className="trace-progress pulse">
          <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          Tracing route to {host}...
        </div>
      )}

      {hops.length > 0 && (
        <div className="trace-results">
          <div className="trace-header-row">
            <span>Hop</span><span>IP Address</span><span>Hostname</span>
            <span>RTT 1</span><span>RTT 2</span><span>RTT 3</span>
          </div>
          {hops.map((hop, i) => (
            <div key={i} className="trace-row fade-in" style={{ animationDelay: `${i * 30}ms` }}>
              <span className="hop-num">{hop.hop}</span>
              <span className="mono">{hop.ip}</span>
              <span className="trace-host">{hop.hostname || '—'}</span>
              <span className={`rtt ${hop.rtt1 < 0 ? 'timeout' : ''}`}>{hop.rtt1 >= 0 ? `${hop.rtt1}ms` : '*'}</span>
              <span className={`rtt ${hop.rtt2 < 0 ? 'timeout' : ''}`}>{hop.rtt2 >= 0 ? `${hop.rtt2}ms` : '*'}</span>
              <span className={`rtt ${hop.rtt3 < 0 ? 'timeout' : ''}`}>{hop.rtt3 >= 0 ? `${hop.rtt3}ms` : '*'}</span>
            </div>
          ))}
        </div>
      )}

      {!running && hops.length === 0 && (
        <div className="trace-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <p>Enter a host to trace the network path</p>
        </div>
      )}

      <style>{`
        .traceroute { padding: 20px; height: 100%; display: flex; flex-direction: column; overflow: hidden; }
        .trace-input-row { display: flex; gap: 8px; margin-bottom: 16px; }
        .trace-progress { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: var(--accent-dim); color: var(--accent); border-radius: var(--radius); font-size: 13px; margin-bottom: 16px; }
        .trace-results { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
        .trace-header-row { display: grid; grid-template-columns: 50px 140px 1fr 80px 80px 80px; padding: 8px 16px; font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
        .trace-row { display: grid; grid-template-columns: 50px 140px 1fr 80px 80px 80px; align-items: center; padding: 10px 16px; background: var(--bg-secondary); border-radius: var(--radius); }
        .trace-row:hover { background: var(--bg-hover); }
        .hop-num { font-weight: 700; color: var(--accent); font-size: 14px; }
        .trace-host { font-size: 12px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; }
        .rtt { font-size: 13px; color: var(--text-secondary); font-family: 'SF Mono', 'Fira Code', monospace; }
        .rtt.timeout { color: var(--text-muted); }
        .trace-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 12px; color: var(--text-muted); }
      `}</style>
    </div>
  );
}

export default Traceroute;
