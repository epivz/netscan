import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import DeviceList from './components/DeviceList';
import PortScanner from './components/PortScanner';
import NetworkInfo from './components/NetworkInfo';
import SpeedTest from './components/SpeedTest';
import Traceroute from './components/Traceroute';
import BandwidthMonitor from './components/BandwidthMonitor';
import MdnsDiscovery from './components/MdnsDiscovery';
import PingMonitor from './components/PingMonitor';
import DnsLookup from './components/DnsLookup';
import SubnetCalculator from './components/SubnetCalculator';
import DeviceHistory from './components/DeviceHistory';
import type { NetworkDevice, NetworkInterface } from './types';

type View = 'devices' | 'ports' | 'info' | 'speed' | 'traceroute' | 'bandwidth' | 'mdns' | 'ping' | 'dns' | 'subnet' | 'history';

const NAV_ITEMS: { section: string; items: { id: View; label: string; icon: string }[] }[] = [
  {
    section: 'Discovery',
    items: [
      { id: 'devices', label: 'Devices', icon: 'M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 21h8M12 17v4' },
      { id: 'ports', label: 'Port Scanner', icon: 'M22 12 18 12 15 21 9 3 6 12 2 12' },
      { id: 'mdns', label: 'mDNS Services', icon: 'M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01' },
      { id: 'history', label: 'Device History', icon: 'M12 2a10 10 0 1 0 10 10M12 6v6l4 2' },
    ],
  },
  {
    section: 'Tools',
    items: [
      { id: 'speed', label: 'Speed Test', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
      { id: 'ping', label: 'Ping Monitor', icon: 'M22 12 18 12 15 21 9 3 6 12 2 12' },
      { id: 'traceroute', label: 'Traceroute', icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' },
      { id: 'dns', label: 'DNS Lookup', icon: 'M11 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 21l-4.35-4.35' },
      { id: 'subnet', label: 'Subnet Calc', icon: 'M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z' },
    ],
  },
  {
    section: 'Monitor',
    items: [
      { id: 'bandwidth', label: 'Bandwidth', icon: 'M22 12 18 12 15 21 9 3 6 12 2 12' },
      { id: 'info', label: 'Interfaces', icon: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 16v4M16 12h4M4 12h4' },
    ],
  },
];

function App() {
  const [view, setView] = useState<View>('devices');
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [scanning, setScanning] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    window.netscan.getTheme().then(t => {
      setTheme(t);
      document.documentElement.setAttribute('data-theme', t);
    }).catch(() => {});
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    await window.netscan.setTheme(next);
  }, [theme]);

  const loadInterfaces = useCallback(async () => {
    try {
      const ifaces = await window.netscan.getInterfaces();
      setInterfaces(ifaces);
    } catch (err) {
      console.error('Failed to load interfaces:', err);
    }
  }, []);

  const startScan = useCallback(async () => {
    setScanning(true);
    try {
      const results = await window.netscan.scanNetwork();
      setDevices(results);
      setLastScanTime(new Date());
      await window.netscan.updateDeviceHistory(results);
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => { loadInterfaces(); }, [loadInterfaces]);

  useEffect(() => {
    const cleanup = window.netscan.onTriggerScan(() => { startScan(); });
    return cleanup;
  }, [startScan]);

  const handleDeviceSelect = (device: NetworkDevice) => {
    setSelectedDevice(device);
    setView('ports');
  };

  const handleExport = async (format: 'csv' | 'json') => {
    const content = format === 'csv'
      ? await window.netscan.exportCsv(devices)
      : await window.netscan.exportJson(devices);
    await window.netscan.saveFile(content, `netscan-export.${format}`);
  };

  return (
    <div className="app">
      <Header
        onScan={startScan}
        scanning={scanning}
        deviceCount={devices.length}
        lastScanTime={lastScanTime}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main className="app-content">
        <div className="app-layout">
          <nav className="sidebar">
            {NAV_ITEMS.map(section => (
              <div key={section.section} className="sidebar-section">
                <div className="sidebar-section-title">{section.section}</div>
                {section.items.map(item => (
                  <button
                    key={item.id}
                    className={`sidebar-item ${view === item.id ? 'active' : ''}`}
                    onClick={() => setView(item.id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={item.icon} />
                    </svg>
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="main-panel">
            {view === 'devices' && (
              <DeviceList devices={devices} scanning={scanning} onDeviceSelect={handleDeviceSelect} onScan={startScan} onExport={handleExport} />
            )}
            {view === 'ports' && (
              <PortScanner selectedDevice={selectedDevice} onBack={() => setView('devices')} />
            )}
            {view === 'info' && (
              <NetworkInfo interfaces={interfaces} onRefresh={loadInterfaces} />
            )}
            {view === 'speed' && <SpeedTest />}
            {view === 'traceroute' && <Traceroute />}
            {view === 'bandwidth' && <BandwidthMonitor />}
            {view === 'mdns' && <MdnsDiscovery />}
            {view === 'ping' && <PingMonitor />}
            {view === 'dns' && <DnsLookup />}
            {view === 'subnet' && <SubnetCalculator />}
            {view === 'history' && <DeviceHistory />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
