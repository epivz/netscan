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

export interface SpeedTestResult {
  downloadSpeed: number;
  uploadSpeed: number;
  ping: number;
  server: string;
  timestamp: number;
}

export interface TracerouteHop {
  hop: number;
  ip: string;
  hostname: string;
  rtt1: number;
  rtt2: number;
  rtt3: number;
}

export interface BandwidthSnapshot {
  timestamp: number;
  rxBytes: number;
  txBytes: number;
  rxRate: number;
  txRate: number;
  iface: string;
}

export interface MdnsService {
  name: string;
  type: string;
  host: string;
  ip: string;
  port: number;
  txt: Record<string, string>;
}

export interface PingResult {
  seq: number;
  time: number;
  alive: boolean;
  timestamp: number;
}

export interface DnsRecord {
  type: string;
  value: string;
  priority?: number;
  ttl?: number;
}

export interface SubnetInfo {
  networkAddress: string;
  broadcastAddress: string;
  firstUsable: string;
  lastUsable: string;
  totalHosts: number;
  usableHosts: number;
  netmask: string;
  cidr: number;
  wildcardMask: string;
}

export interface DeviceHistoryEntry {
  ip: string;
  mac: string;
  hostname: string;
  vendor: string;
  firstSeen: number;
  lastSeen: number;
  status: 'online' | 'offline';
}

export interface FavoriteHost {
  ip: string;
  label: string;
  mac?: string;
  addedAt: number;
}

declare global {
  interface Window {
    netscan: {
      scanNetwork: (subnet?: string) => Promise<NetworkDevice[]>;
      scanPorts: (host: string, ports?: number[]) => Promise<PortResult[]>;
      getInterfaces: () => Promise<NetworkInterface[]>;
      onScanProgress: (callback: (progress: number) => void) => () => void;
      sendWol: (mac: string, broadcast?: string) => Promise<boolean>;
      runSpeedTest: () => Promise<SpeedTestResult>;
      runTraceroute: (host: string) => Promise<TracerouteHop[]>;
      getBandwidth: (iface?: string) => Promise<BandwidthSnapshot>;
      discoverMdns: () => Promise<MdnsService[]>;
      pingSingle: (host: string) => Promise<PingResult>;
      dnsLookup: (domain: string) => Promise<DnsRecord[]>;
      calculateSubnet: (cidr: string) => Promise<SubnetInfo | null>;
      getDeviceHistory: () => Promise<DeviceHistoryEntry[]>;
      updateDeviceHistory: (devices: NetworkDevice[]) => Promise<DeviceHistoryEntry[]>;
      exportCsv: (devices: NetworkDevice[], ports?: PortResult[]) => Promise<string>;
      exportJson: (devices: NetworkDevice[], ports?: PortResult[]) => Promise<string>;
      getFavorites: () => Promise<FavoriteHost[]>;
      saveFavorite: (fav: FavoriteHost) => Promise<FavoriteHost[]>;
      removeFavorite: (ip: string) => Promise<FavoriteHost[]>;
      getTheme: () => Promise<string>;
      setTheme: (theme: string) => Promise<void>;
      saveFile: (content: string, defaultName: string) => Promise<boolean>;
      onTriggerScan: (callback: () => void) => () => void;
    };
  }
}
