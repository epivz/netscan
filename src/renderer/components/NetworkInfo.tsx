import type { NetworkInterface } from '../types';

interface NetworkInfoProps {
  interfaces: NetworkInterface[];
  onRefresh: () => void;
}

function NetworkInfo({ interfaces, onRefresh }: NetworkInfoProps) {
  const externalInterfaces = interfaces.filter(i => !i.internal);
  const internalInterfaces = interfaces.filter(i => i.internal);

  return (
    <div className="network-info">
      <div className="info-header">
        <h2>Network Interfaces</h2>
        <button className="refresh-btn" onClick={onRefresh}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          Refresh
        </button>
      </div>

      {externalInterfaces.length > 0 && (
        <section className="info-section">
          <h3>External</h3>
          <div className="interface-grid">
            {externalInterfaces.map((iface) => (
              <InterfaceCard key={`${iface.name}-${iface.ip}`} iface={iface} />
            ))}
          </div>
        </section>
      )}

      {internalInterfaces.length > 0 && (
        <section className="info-section">
          <h3>Internal</h3>
          <div className="interface-grid">
            {internalInterfaces.map((iface) => (
              <InterfaceCard key={`${iface.name}-${iface.ip}`} iface={iface} />
            ))}
          </div>
        </section>
      )}

      {interfaces.length === 0 && (
        <div className="info-empty">
          <p>No network interfaces detected. Click refresh to try again.</p>
        </div>
      )}

      <style>{`
        .network-info {
          padding: 20px;
          overflow-y: auto;
          height: 100%;
        }
        .info-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .info-header h2 {
          font-size: 18px;
          font-weight: 600;
        }
        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          border-radius: var(--radius);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .refresh-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .info-section {
          margin-bottom: 24px;
        }
        .info-section h3 {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }
        .interface-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 12px;
        }
        .info-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

function InterfaceCard({ iface }: { iface: NetworkInterface }) {
  return (
    <div className="iface-card">
      <div className="iface-header">
        <div className="iface-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>
        <span className="iface-name">{iface.name}</span>
      </div>
      <div className="iface-details">
        <div className="iface-row">
          <span className="iface-label">IP Address</span>
          <span className="iface-value mono">{iface.ip}</span>
        </div>
        <div className="iface-row">
          <span className="iface-label">MAC</span>
          <span className="iface-value mono">{iface.mac}</span>
        </div>
        <div className="iface-row">
          <span className="iface-label">Netmask</span>
          <span className="iface-value mono">{iface.netmask}</span>
        </div>
      </div>

      <style>{`
        .iface-card {
          padding: 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          transition: all 0.15s;
        }
        .iface-card:hover {
          border-color: var(--accent);
        }
        .iface-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .iface-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: var(--accent-dim);
          color: var(--accent);
          border-radius: var(--radius);
        }
        .iface-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .iface-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .iface-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .iface-label {
          font-size: 12px;
          color: var(--text-muted);
        }
        .iface-value {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .iface-value.mono {
          font-family: 'SF Mono', 'Fira Code', monospace;
        }
      `}</style>
    </div>
  );
}

export default NetworkInfo;
