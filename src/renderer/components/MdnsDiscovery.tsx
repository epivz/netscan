import { useState } from 'react';
import type { MdnsService } from '../types';

function MdnsDiscovery() {
  const [services, setServices] = useState<MdnsService[]>([]);
  const [scanning, setScanning] = useState(false);

  const discover = async () => {
    setScanning(true);
    try {
      const results = await window.netscan.discoverMdns();
      setServices(results);
    } catch (err) {
      console.error('mDNS discovery failed:', err);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="mdns">
      <div className="section-header">
        <h2>Service Discovery (mDNS)</h2>
        <button className="action-btn primary" onClick={discover} disabled={scanning}>
          {scanning ? 'Scanning...' : 'Discover Services'}
        </button>
      </div>

      {services.length > 0 && (
        <div className="mdns-grid">
          {services.map((svc, i) => (
            <div key={i} className="card fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="mdns-name">{svc.name}</div>
              <div className="mdns-type">{svc.type}</div>
              <div className="mdns-details">
                {svc.host && <div><span className="mdns-label">Host:</span> {svc.host}</div>}
                {svc.ip && <div><span className="mdns-label">IP:</span> <span className="mono">{svc.ip}</span></div>}
                {svc.port > 0 && <div><span className="mdns-label">Port:</span> {svc.port}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {!scanning && services.length === 0 && (
        <div className="mdns-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
          <p>Click "Discover Services" to find mDNS/Bonjour services on your network</p>
        </div>
      )}

      <style>{`
        .mdns { padding: 20px; height: 100%; overflow-y: auto; }
        .mdns-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
        .mdns-name { font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
        .mdns-type { font-size: 12px; color: var(--accent); margin-bottom: 10px; }
        .mdns-details { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--text-secondary); }
        .mdns-label { color: var(--text-muted); font-size: 11px; }
        .mdns-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60%; gap: 12px; color: var(--text-muted); }
      `}</style>
    </div>
  );
}

export default MdnsDiscovery;
