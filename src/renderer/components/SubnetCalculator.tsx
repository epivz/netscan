import { useState } from 'react';
import type { SubnetInfo } from '../types';

function SubnetCalculator() {
  const [cidr, setCidr] = useState('');
  const [info, setInfo] = useState<SubnetInfo | null>(null);

  const calculate = async () => {
    if (!cidr) return;
    try {
      const result = await window.netscan.calculateSubnet(cidr);
      setInfo(result);
    } catch (err) {
      console.error('Subnet calc failed:', err);
    }
  };

  return (
    <div className="subnet-calc">
      <div className="section-header">
        <h2>Subnet Calculator</h2>
      </div>

      <div className="subnet-input-row">
        <input
          className="text-input"
          style={{ flex: 1 }}
          type="text"
          value={cidr}
          onChange={(e) => setCidr(e.target.value)}
          placeholder="Enter CIDR (e.g. 192.168.1.0/24)"
          onKeyDown={(e) => e.key === 'Enter' && calculate()}
        />
        <button className="action-btn primary" onClick={calculate} disabled={!cidr}>
          Calculate
        </button>
      </div>

      {info && (
        <div className="subnet-results fade-in">
          <div className="subnet-grid">
            <div className="subnet-field">
              <span className="subnet-label">Network Address</span>
              <span className="subnet-value mono">{info.networkAddress}</span>
            </div>
            <div className="subnet-field">
              <span className="subnet-label">Broadcast Address</span>
              <span className="subnet-value mono">{info.broadcastAddress}</span>
            </div>
            <div className="subnet-field">
              <span className="subnet-label">First Usable</span>
              <span className="subnet-value mono">{info.firstUsable}</span>
            </div>
            <div className="subnet-field">
              <span className="subnet-label">Last Usable</span>
              <span className="subnet-value mono">{info.lastUsable}</span>
            </div>
            <div className="subnet-field">
              <span className="subnet-label">Netmask</span>
              <span className="subnet-value mono">{info.netmask}</span>
            </div>
            <div className="subnet-field">
              <span className="subnet-label">Wildcard Mask</span>
              <span className="subnet-value mono">{info.wildcardMask}</span>
            </div>
            <div className="subnet-field">
              <span className="subnet-label">CIDR</span>
              <span className="subnet-value mono">/{info.cidr}</span>
            </div>
            <div className="subnet-field">
              <span className="subnet-label">Total Hosts</span>
              <span className="subnet-value">{info.totalHosts.toLocaleString()}</span>
            </div>
            <div className="subnet-field">
              <span className="subnet-label">Usable Hosts</span>
              <span className="subnet-value" style={{ color: 'var(--success)' }}>{info.usableHosts.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {!info && (
        <div className="subnet-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <p>Enter a CIDR notation to calculate subnet details</p>
        </div>
      )}

      <style>{`
        .subnet-calc { padding: 20px; height: 100%; overflow-y: auto; }
        .subnet-input-row { display: flex; gap: 8px; margin-bottom: 20px; }
        .subnet-results { }
        .subnet-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
        .subnet-field { padding: 14px 16px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); }
        .subnet-label { display: block; font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .subnet-value { font-size: 15px; font-weight: 600; color: var(--text-primary); }
        .subnet-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60%; gap: 12px; color: var(--text-muted); }
      `}</style>
    </div>
  );
}

export default SubnetCalculator;
