type View = 'devices' | 'ports' | 'info';

interface HeaderProps {
  view: View;
  onViewChange: (view: View) => void;
  onScan: () => void;
  scanning: boolean;
  deviceCount: number;
  lastScanTime: Date | null;
}

function Header({ view, onViewChange, onScan, scanning, deviceCount, lastScanTime }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
          <h1>NetScan</h1>
        </div>
        <nav className="nav-tabs">
          <button
            className={`nav-tab ${view === 'devices' ? 'active' : ''}`}
            onClick={() => onViewChange('devices')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            Devices
            {deviceCount > 0 && <span className="badge">{deviceCount}</span>}
          </button>
          <button
            className={`nav-tab ${view === 'ports' ? 'active' : ''}`}
            onClick={() => onViewChange('ports')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
            </svg>
            Ports
          </button>
          <button
            className={`nav-tab ${view === 'info' ? 'active' : ''}`}
            onClick={() => onViewChange('info')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Network
          </button>
        </nav>
      </div>
      <div className="header-right">
        {lastScanTime && (
          <span className="last-scan">
            Last scan: {lastScanTime.toLocaleTimeString()}
          </span>
        )}
        <button
          className={`scan-button ${scanning ? 'scanning' : ''}`}
          onClick={onScan}
          disabled={scanning}
        >
          <svg
            className={scanning ? 'spin' : ''}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          {scanning ? 'Scanning...' : 'Scan Network'}
        </button>
      </div>

      <style>{`
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          -webkit-app-region: drag;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--accent);
        }
        .logo h1 {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .nav-tabs {
          display: flex;
          gap: 4px;
        }
        .nav-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .nav-tab:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .nav-tab.active {
          background: var(--accent-dim);
          color: var(--accent);
        }
        .badge {
          background: var(--accent);
          color: white;
          font-size: 11px;
          padding: 1px 6px;
          border-radius: 10px;
          font-weight: 600;
        }
        .last-scan {
          font-size: 12px;
          color: var(--text-muted);
        }
        .scan-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: var(--radius);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .scan-button:hover:not(:disabled) {
          background: var(--accent-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(108, 99, 255, 0.3);
        }
        .scan-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .scan-button.scanning {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
        }
      `}</style>
    </header>
  );
}

export default Header;
