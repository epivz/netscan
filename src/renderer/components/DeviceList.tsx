import type { NetworkDevice } from '../types';

interface DeviceListProps {
  devices: NetworkDevice[];
  scanning: boolean;
  onDeviceSelect: (device: NetworkDevice) => void;
  onScan: () => void;
}

function DeviceList({ devices, scanning, onDeviceSelect, onScan }: DeviceListProps) {
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
        <p>Click "Scan Network" to discover devices on your local network</p>
        <button className="empty-scan-btn" onClick={onScan}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          Start Scan
        </button>

        <style>{`
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 12px;
            color: var(--text-secondary);
          }
          .empty-icon {
            color: var(--text-muted);
            margin-bottom: 8px;
            opacity: 0.5;
          }
          .empty-state h2 {
            font-size: 20px;
            color: var(--text-primary);
          }
          .empty-state p {
            font-size: 14px;
            color: var(--text-muted);
          }
          .empty-scan-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 16px;
            padding: 12px 24px;
            background: var(--accent);
            color: white;
            border: none;
            border-radius: var(--radius);
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .empty-scan-btn:hover {
            background: var(--accent-hover);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(108, 99, 255, 0.3);
          }
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
      <div className="device-grid">
        {devices.map((device, index) => (
          <div
            key={device.ip}
            className="device-card fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => onDeviceSelect(device)}
          >
            <div className="device-card-header">
              <div className="device-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div className="device-latency">
                <span className={`latency-dot ${device.latency < 50 ? 'good' : device.latency < 200 ? 'medium' : 'slow'}`} />
                {device.latency}ms
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
            <div className="device-action">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .device-list {
          padding: 20px;
          overflow-y: auto;
          height: 100%;
        }
        .scan-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--accent-dim);
          color: var(--accent);
          border-radius: var(--radius);
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 16px;
        }
        .device-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 12px;
        }
        .device-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
        }
        .device-card:hover {
          background: var(--bg-hover);
          border-color: var(--accent);
          transform: translateY(-2px);
          box-shadow: var(--shadow);
        }
        .device-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .device-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: var(--accent-dim);
          color: var(--accent);
          border-radius: var(--radius);
        }
        .device-latency {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
        }
        .latency-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .latency-dot.good { background: var(--success); }
        .latency-dot.medium { background: var(--warning); }
        .latency-dot.slow { background: var(--danger); }
        .device-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .device-ip {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          font-family: 'SF Mono', 'Fira Code', monospace;
        }
        .device-hostname {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .device-meta {
          display: flex;
          gap: 12px;
          margin-top: 4px;
        }
        .device-mac {
          font-size: 11px;
          color: var(--text-muted);
          font-family: 'SF Mono', 'Fira Code', monospace;
        }
        .device-vendor {
          font-size: 11px;
          color: var(--accent);
          font-weight: 500;
        }
        .device-action {
          position: absolute;
          top: 50%;
          right: 16px;
          transform: translateY(-50%);
          color: var(--text-muted);
          opacity: 0;
          transition: opacity 0.15s;
        }
        .device-card:hover .device-action {
          opacity: 1;
          color: var(--accent);
        }
      `}</style>
    </div>
  );
}

export default DeviceList;
