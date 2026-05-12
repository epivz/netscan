import { contextBridge, ipcRenderer } from 'electron';

export interface NetworkDevice {
  ip: string;
  mac: string;
  hostname: string;
  vendor: string;
  latency: number;
}

export interface PortResult {
  port: number;
  state: 'open' | 'closed' | 'filtered';
  service: string;
}

export interface NetworkInterface {
  name: string;
  ip: string;
  mac: string;
  netmask: string;
  family: string;
  internal: boolean;
}

const api = {
  scanNetwork: (subnet?: string): Promise<NetworkDevice[]> =>
    ipcRenderer.invoke('scan-network', subnet),
  scanPorts: (host: string, ports?: number[]): Promise<PortResult[]> =>
    ipcRenderer.invoke('scan-ports', host, ports),
  getInterfaces: (): Promise<NetworkInterface[]> =>
    ipcRenderer.invoke('get-interfaces'),
  onScanProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on('scan-progress', (_event, progress: number) => callback(progress));
    return () => {
      ipcRenderer.removeAllListeners('scan-progress');
    };
  },
};

contextBridge.exposeInMainWorld('netscan', api);
