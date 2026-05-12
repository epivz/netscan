import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import DeviceList from './components/DeviceList';
import PortScanner from './components/PortScanner';
import NetworkInfo from './components/NetworkInfo';
import type { NetworkDevice, NetworkInterface } from './types';

type View = 'devices' | 'ports' | 'info';

function App() {
  const [view, setView] = useState<View>('devices');
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [scanning, setScanning] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

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
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    loadInterfaces();
  }, [loadInterfaces]);

  const handleDeviceSelect = (device: NetworkDevice) => {
    setSelectedDevice(device);
    setView('ports');
  };

  return (
    <div className="app">
      <Header
        view={view}
        onViewChange={setView}
        onScan={startScan}
        scanning={scanning}
        deviceCount={devices.length}
        lastScanTime={lastScanTime}
      />
      <main className="app-content">
        {view === 'devices' && (
          <DeviceList
            devices={devices}
            scanning={scanning}
            onDeviceSelect={handleDeviceSelect}
            onScan={startScan}
          />
        )}
        {view === 'ports' && (
          <PortScanner
            selectedDevice={selectedDevice}
            onBack={() => setView('devices')}
          />
        )}
        {view === 'info' && (
          <NetworkInfo interfaces={interfaces} onRefresh={loadInterfaces} />
        )}
      </main>
    </div>
  );
}

export default App;
