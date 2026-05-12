import { useState } from 'react';
import type { DnsRecord } from '../types';

function DnsLookup() {
  const [domain, setDomain] = useState('');
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    if (!domain) return;
    setLoading(true);
    setRecords([]);
    try {
      const results = await window.netscan.dnsLookup(domain);
      setRecords(results);
    } catch (err) {
      console.error('DNS lookup failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const typeColors: Record<string, string> = {
    A: 'var(--success)', AAAA: 'var(--accent)', MX: 'var(--warning)',
    CNAME: '#e879f9', NS: '#38bdf8', TXT: 'var(--text-secondary)',
  };

  return (
    <div className="dns-lookup">
      <div className="section-header">
        <h2>DNS Lookup</h2>
      </div>

      <div className="dns-input-row">
        <input
          className="text-input"
          style={{ flex: 1 }}
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="Enter domain (e.g. google.com)"
          onKeyDown={(e) => e.key === 'Enter' && lookup()}
        />
        <button className="action-btn primary" onClick={lookup} disabled={loading || !domain}>
          {loading ? 'Looking up...' : 'Lookup'}
        </button>
      </div>

      {records.length > 0 && (
        <div className="dns-results">
          {records.map((r, i) => (
            <div key={i} className="dns-row fade-in" style={{ animationDelay: `${i * 30}ms` }}>
              <span className="dns-type" style={{ color: typeColors[r.type] || 'var(--text-secondary)' }}>{r.type}</span>
              <span className="dns-value mono">{r.value}</span>
              {r.priority !== undefined && <span className="dns-priority">Priority: {r.priority}</span>}
            </div>
          ))}
        </div>
      )}

      {!loading && records.length === 0 && (
        <div className="dns-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p>Enter a domain name to query DNS records</p>
        </div>
      )}

      <style>{`
        .dns-lookup { padding: 20px; height: 100%; display: flex; flex-direction: column; overflow: hidden; }
        .dns-input-row { display: flex; gap: 8px; margin-bottom: 16px; }
        .dns-results { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
        .dns-row { display: grid; grid-template-columns: 70px 1fr auto; align-items: center; padding: 10px 16px; background: var(--bg-secondary); border-radius: var(--radius); gap: 12px; }
        .dns-row:hover { background: var(--bg-hover); }
        .dns-type { font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .dns-value { font-size: 13px; color: var(--text-primary); word-break: break-all; }
        .dns-priority { font-size: 11px; color: var(--text-muted); }
        .dns-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 12px; color: var(--text-muted); }
      `}</style>
    </div>
  );
}

export default DnsLookup;
