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

interface NetScanAPI {
  scanNetwork: (subnet?: string) => Promise<NetworkDevice[]>;
  scanPorts: (host: string, ports?: number[]) => Promise<PortResult[]>;
  getInterfaces: () => Promise<NetworkInterface[]>;
  onScanProgress: (callback: (progress: number) => void) => () => void;
}

declare global {
  interface Window {
    netscan: NetScanAPI;
  }
}
