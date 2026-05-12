import { useState } from 'react';
import type { NetworkDevice, PortResult } from '../types';

interface PortScannerProps {
  selectedDevice: NetworkDevice | null;
  onBack: () => void;
}

function PortScanner({ selectedDevice, onBack }: PortScannerProps) {
  const [host, setHost] = useState(selectedDevice?.ip || '');
  const [ports, setPorts] = useState<PortResult[]>([]);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');

  const startPortScan = async () => {
    if (!host) return;
    setScanning(true);
    setPorts([]);
    try {
      const results = await window.netscan.scanPorts(host);
      setPorts(results);
    } catch (err) {
      console.error('Port scan failed:', err);
    } finally {
      setScanning(false);
    }
  };

  const filteredPorts = ports.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'open') return p.state === 'open';
    return p.state === 'closed' || p.state === 'filtered';
  });

  const openCount = ports.filter(p => p.state === 'open').length;
  const closedCount = ports.filter(p => p.state === 'closed' || p.state === 'filtered').length;

  return (
    <div className="port-scanner">
      <div className="port-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Back
        </button>
        <div className="port-input-group">
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="Enter IP address (e.g. 192.168.1.1)"
            className="port-input"
            onKeyDown={(e) => e.key === 'Enter' && startPortScan()}
          />
          <button
            className="port-scan-btn"
            onClick={startPortScan}
            disabled={scanning || !host}
          >
            {scanning ? (
              <>
                <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
                Scanning...
              </>
            ) : 'Scan Ports'}
          </button>
        </div>
      </div>

      {ports.length > 0 && (
        <div className="port-stats">
          <button
            className={`stat-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({ports.length})
          </button>
          <button
            className={`stat-pill open ${filter === 'open' ? 'active' : ''}`}
            onClick={() => setFilter('open')}
          >
            Open ({openCount})
          </button>
          <button
            className={`stat-pill closed ${filter === 'closed' ? 'active' : ''}`}
            onClick={() => setFilter('closed')}
          >
            Closed ({closedCount})
          </button>
        </div>
      )}

      {scanning && (
        <div className="scan-progress pulse">
          <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          Scanning ports on {host}...
        </div>
      )}

      <div className="port-results">
        {filteredPorts.map((port, index) => (
          <div
            key={port.port}
            className={`port-row fade-in ${port.state}`}
            style={{ animationDelay: `${index * 20}ms` }}
          >
            <div className="port-number">{port.port}</div>
            <div className="port-service">{port.service}</div>
            <div className={`port-state ${port.state}`}>
              <span className="state-dot" />
              {port.state}
            </div>
          </div>
        ))}
      </div>

      {!scanning && ports.length === 0 && (
        <div className="port-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
          </svg>
          <p>Enter an IP address and scan to discover open ports</p>
        </div>
      )}

      <style>{`
        .port-scanner {
          padding: 20px;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .port-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }
        .back-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          border-radius: var(--radius);
          cursor: pointer;
          font-size: 13px;
          transition: all 0.15s;
        }
        .back-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .port-input-group {
          display: flex;
          flex: 1;
          gap: 8px;
        }
        .port-input {
          flex: 1;
          padding: 10px 14px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-primary);
          border-radius: var(--radius);
          font-size: 14px;
          font-family: 'SF Mono', 'Fira Code', monospace;
          outline: none;
          transition: border-color 0.15s;
        }
        .port-input:focus {
          border-color: var(--accent);
        }
        .port-scan-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: var(--radius);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .port-scan-btn:hover:not(:disabled) {
          background: var(--accent-hover);
        }
        .port-scan-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .port-stats {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        .stat-pill {
          padding: 6px 14px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .stat-pill:hover {
          background: var(--bg-hover);
        }
        .stat-pill.active {
          background: var(--accent-dim);
          border-color: var(--accent);
          color: var(--accent);
        }
        .stat-pill.open.active {
          background: rgba(76, 223, 139, 0.1);
          border-color: var(--success);
          color: var(--success);
        }
        .stat-pill.closed.active {
          background: rgba(255, 107, 107, 0.1);
          border-color: var(--danger);
          color: var(--danger);
        }
        .scan-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--accent-dim);
          color: var(--accent);
          border-radius: var(--radius);
          font-size: 13px;
          margin-bottom: 16px;
        }
        .port-results {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .port-row {
          display: grid;
          grid-template-columns: 80px 1fr 100px;
          align-items: center;
          padding: 10px 16px;
          background: var(--bg-secondary);
          border-radius: var(--radius);
          transition: background 0.15s;
        }
        .port-row:hover {
          background: var(--bg-hover);
        }
        .port-number {
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .port-service {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .port-state {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
        }
        .port-state.open { color: var(--success); }
        .port-state.closed { color: var(--danger); }
        .port-state.filtered { color: var(--warning); }
        .state-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }
        .port-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          gap: 12px;
          color: var(--text-muted);
        }
        .port-empty p {
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

export default PortScanner;
