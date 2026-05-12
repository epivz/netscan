import { useState, useEffect } from 'react';
import type { NetworkDevice, FavoriteHost } from '../types';

interface DeviceListProps {
  devices: NetworkDevice[];
  scanning: boolean;
  onDeviceSelect: (device: NetworkDevice) => void;
  onScan: () => void;
  onExport: (format: 'csv' | 'json') => void;
}

function DeviceList({ devices, scanning, onDeviceSelect, onScan, onExport }: DeviceListProps) {
  const [favorites, setFavorites] = useState<FavoriteHost[]>([]);
  const [wolStatus, setWolStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    window.netscan.getFavorites().then(setFavorites).catch(() => {});
  }, []);

  const isFavorite = (ip: string) => favorites.some(f => f.ip === ip);

  const toggleFavorite = async (device: NetworkDevice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite(device.ip)) {
      const updated = await window.netscan.removeFavorite(device.ip);
      setFavorites(updated);
    } else {
      const updated = await window.netscan.saveFavorite({
        ip: device.ip, label: device.hostname || device.ip,
        mac: device.mac, addedAt: Date.now(),
      });
      setFavorites(updated);
    }
  };

  const sendWol = async (device: NetworkDevice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (device.mac === 'unknown') return;
    setWolStatus(prev => ({ ...prev, [device.ip]: 'sending' }));
    const ok = await window.netscan.sendWol(device.mac);
    setWolStatus(prev => ({ ...prev, [device.ip]: ok ? 'sent' : 'failed' }));
    setTimeout(() => setWolStatus(prev => { const n = { ...prev }; delete n[device.ip]; return n; }), 3000);
  };

  if (devices.length === 0 && !scanning) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
        </div>
        <h2>No Devices Found</h2>
        <p>Click &quot;Scan Network&quot; to discover devices on your local network</p>
        <button className="empty-scan-btn" onClick={onScan}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          Start Scan
        </button>
        <style>{`
          .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; color: var(--text-secondary); }
          .empty-icon { color: var(--text-muted); margin-bottom: 8px; opacity: 0.5; }
          .empty-state h2 { font-size: 20px; color: var(--text-primary); }
          .empty-state p { font-size: 14px; color: var(--text-muted); }
          .empty-scan-btn { display: flex; align-items: center; gap: 8px; margin-top: 16px; padding: 12px 24px; background: var(--accent); color: white; border: none; border-radius: var(--radius); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
          .empty-scan-btn:hover { background: var(--accent-hover); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(108, 99, 255, 0.3); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="device-list">
      {scanning && (
        <div className="scan-banner pulse">
          <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          Scanning network...
        </div>
      )}

      {devices.length > 0 && (
        <div className="export-bar">
          <button className="action-btn" onClick={() => onExport('csv')}>Export CSV</button>
          <button className="action-btn" onClick={() => onExport('json')}>Export JSON</button>
        </div>
      )}

      <div className="device-grid">
        {devices.map((device, index) => (
          <div key={device.ip} className="device-card fade-in" style={{ animationDelay: `${index * 50}ms` }} onClick={() => onDeviceSelect(device)}>
            <div className="device-card-header">
              <div className="device-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div className="device-card-actions">
                <button className={`icon-btn fav-btn ${isFavorite(device.ip) ? 'active' : ''}`} onClick={(e) => toggleFavorite(device, e)} title="Favorite">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={isFavorite(device.ip) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                  </svg>
                </button>
                {device.mac !== 'unknown' && (
                  <button className="icon-btn wol-btn" onClick={(e) => sendWol(device, e)} title="Wake-on-LAN">
                    {wolStatus[device.ip] === 'sending' ? (
                      <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" /></svg>
                    ) : wolStatus[device.ip] === 'sent' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><polyline points="20,6 9,17 4,12" /></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                    )}
                  </button>
                )}
                <div className="device-latency">
                  <span className={`latency-dot ${device.latency < 50 ? 'good' : device.latency < 200 ? 'medium' : 'slow'}`} />
                  {device.latency}ms
                </div>
              </div>
            </div>
            <div className="device-info">
              <div className="device-ip">{device.ip}</div>
              <div className="device-hostname">{device.hostname || 'Unknown host'}</div>
              <div className="device-meta">
                <span className="device-mac">{device.mac !== 'unknown' ? device.mac : '—'}</span>
                <span className="device-vendor">{device.vendor}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .device-list { padding: 20px; overflow-y: auto; height: 100%; }
        .scan-banner { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: var(--accent-dim); color: var(--accent); border-radius: var(--radius); font-size: 13px; font-weight: 500; margin-bottom: 16px; }
        .export-bar { display: flex; gap: 8px; margin-bottom: 16px; }
        .device-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
        .device-card { display: flex; flex-direction: column; gap: 12px; padding: 16px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); cursor: pointer; transition: all 0.15s ease; }
        .device-card:hover { background: var(--bg-hover); border-color: var(--accent); transform: translateY(-2px); box-shadow: var(--shadow); }
        .device-card-header { display: flex; align-items: center; justify-content: space-between; }
        .device-card-actions { display: flex; align-items: center; gap: 6px; }
        .device-icon { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: var(--accent-dim); color: var(--accent); border-radius: var(--radius); }
        .icon-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: transparent; border: none; color: var(--text-muted); border-radius: var(--radius); cursor: pointer; transition: all 0.15s; }
        .icon-btn:hover { background: var(--bg-hover); color: var(--accent); }
        .fav-btn.active { color: var(--warning); }
        .device-latency { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); font-weight: 500; }
        .latency-dot { width: 8px; height: 8px; border-radius: 50%; }
        .latency-dot.good { background: var(--success); }
        .latency-dot.medium { background: var(--warning); }
        .latency-dot.slow { background: var(--danger); }
        .device-info { display: flex; flex-direction: column; gap: 4px; }
        .device-ip { font-size: 16px; font-weight: 600; color: var(--text-primary); font-family: 'SF Mono', 'Fira Code', monospace; }
        .device-hostname { font-size: 13px; color: var(--text-secondary); }
        .device-meta { display: flex; gap: 12px; margin-top: 4px; }
        .device-mac { font-size: 11px; color: var(--text-muted); font-family: 'SF Mono', 'Fira Code', monospace; }
        .device-vendor { font-size: 11px; color: var(--accent); font-weight: 500; }
      `}</style>
    </div>
  );
}

export default DeviceList;
