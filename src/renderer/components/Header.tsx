interface HeaderProps {
  onScan: () => void;
  scanning: boolean;
  deviceCount: number;
  lastScanTime: Date | null;
  theme: string;
  onToggleTheme: () => void;
}

function Header({ onScan, scanning, deviceCount, lastScanTime, theme, onToggleTheme }: HeaderProps) {
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
        {deviceCount > 0 && <span className="device-count">{deviceCount} devices</span>}
      </div>
      <div className="header-right">
        {lastScanTime && <span className="last-scan">Last scan: {lastScanTime.toLocaleTimeString()}</span>}
        <button className="theme-toggle" onClick={onToggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
          )}
        </button>
        <button className={`scan-button ${scanning ? 'scanning' : ''}`} onClick={onScan} disabled={scanning}>
          <svg className={scanning ? 'spin' : ''} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          {scanning ? 'Scanning...' : 'Scan Network'}
        </button>
      </div>

      <style>{`
        .header { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; background: var(--bg-secondary); border-bottom: 1px solid var(--border); -webkit-app-region: drag; }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .header-right { display: flex; align-items: center; gap: 12px; }
        .logo { display: flex; align-items: center; gap: 8px; color: var(--accent); }
        .logo h1 { font-size: 18px; font-weight: 700; letter-spacing: -0.5px; }
        .device-count { font-size: 12px; color: var(--text-muted); background: var(--bg-tertiary); padding: 2px 10px; border-radius: 10px; }
        .last-scan { font-size: 12px; color: var(--text-muted); }
        .theme-toggle { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-secondary); border-radius: var(--radius); cursor: pointer; transition: all 0.15s; }
        .theme-toggle:hover { background: var(--bg-hover); color: var(--accent); }
        .scan-button { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: var(--accent); color: white; border: none; border-radius: var(--radius); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
        .scan-button:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(108, 99, 255, 0.3); }
        .scan-button:disabled { opacity: 0.7; cursor: not-allowed; }
        .scan-button.scanning { background: var(--bg-tertiary); color: var(--text-secondary); }
      `}</style>
    </header>
  );
}

export default Header;
