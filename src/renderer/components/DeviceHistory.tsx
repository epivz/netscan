import { useState, useEffect } from 'react';
import type { DeviceHistoryEntry } from '../types';

function DeviceHistory() {
  const [history, setHistory] = useState<DeviceHistoryEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const h = await window.netscan.getDeviceHistory();
      setHistory(h);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const filtered = history.filter(d => {
    if (filter === 'all') return true;
    return d.status === filter;
  });

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  return (
    <div className="device-history">
      <div className="section-header">
        <h2>Device History</h2>
        <button className="action-btn" onClick={loadHistory}>Refresh</button>
      </div>

      <div className="history-filters">
        {(['all', 'online', 'offline'] as const).map(f => (
          <button key={f} className={`stat-pill ${filter === f ? 'active' : ''} ${f}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? history.length : history.filter(d => d.status === f).length})
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="history-list">
          <div className="history-header-row">
            <span>Status</span><span>IP Address</span><span>MAC</span><span>Hostname</span><span>Vendor</span><span>First Seen</span><span>Last Seen</span>
          </div>
          {filtered.map((entry, i) => (
            <div key={i} className="history-row fade-in" style={{ animationDelay: `${i * 20}ms` }}>
              <span className={`status-badge ${entry.status}`}>{entry.status}</span>
              <span className="mono">{entry.ip}</span>
              <span className="mono hist-mac">{entry.mac !== 'unknown' ? entry.mac : '—'}</span>
              <span className="hist-hostname">{entry.hostname || '—'}</span>
              <span className="hist-vendor">{entry.vendor}</span>
              <span className="hist-time">{formatTime(entry.firstSeen)}</span>
              <span className="hist-time">{formatTime(entry.lastSeen)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="history-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
          </svg>
          <p>No device history yet. Run a network scan first to start tracking devices.</p>
        </div>
      )}

      <style>{`
        .device-history { padding: 20px; height: 100%; display: flex; flex-direction: column; overflow: hidden; }
        .history-filters { display: flex; gap: 8px; margin-bottom: 16px; }
        .stat-pill { padding: 6px 14px; background: var(--bg-secondary); border: 1px solid var(--border); color: var(--text-secondary); border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
        .stat-pill:hover { background: var(--bg-hover); }
        .stat-pill.active { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); }
        .stat-pill.online.active { background: rgba(76, 223, 139, 0.1); border-color: var(--success); color: var(--success); }
        .stat-pill.offline.active { background: rgba(255, 107, 107, 0.1); border-color: var(--danger); color: var(--danger); }
        .history-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
        .history-header-row { display: grid; grid-template-columns: 70px 120px 160px 1fr 100px 150px 150px; padding: 8px 16px; font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
        .history-row { display: grid; grid-template-columns: 70px 120px 160px 1fr 100px 150px 150px; align-items: center; padding: 10px 16px; background: var(--bg-secondary); border-radius: var(--radius); font-size: 13px; }
        .history-row:hover { background: var(--bg-hover); }
        .status-badge { font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .status-badge.online { color: var(--success); }
        .status-badge.offline { color: var(--danger); }
        .hist-mac { font-size: 11px; color: var(--text-muted); }
        .hist-hostname { color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; }
        .hist-vendor { font-size: 12px; color: var(--accent); }
        .hist-time { font-size: 11px; color: var(--text-muted); }
        .history-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 12px; color: var(--text-muted); }
      `}</style>
    </div>
  );
}

export default DeviceHistory;
