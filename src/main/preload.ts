import { contextBridge, ipcRenderer } from 'electron';

import type {
  NetworkDevice, PortResult, NetworkInterface, SpeedTestResult,
  TracerouteHop, BandwidthSnapshot, MdnsService, PingResult,
  DnsRecord, SubnetInfo, DeviceHistoryEntry, FavoriteHost,
} from './scanner';

export type {
  NetworkDevice, PortResult, NetworkInterface, SpeedTestResult,
  TracerouteHop, BandwidthSnapshot, MdnsService, PingResult,
  DnsRecord, SubnetInfo, DeviceHistoryEntry, FavoriteHost,
};

const api = {
  // Original features
  scanNetwork: (subnet?: string): Promise<NetworkDevice[]> =>
    ipcRenderer.invoke('scan-network', subnet),
  scanPorts: (host: string, ports?: number[]): Promise<PortResult[]> =>
    ipcRenderer.invoke('scan-ports', host, ports),
  getInterfaces: (): Promise<NetworkInterface[]> =>
    ipcRenderer.invoke('get-interfaces'),
  onScanProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on('scan-progress', (_event, progress: number) => callback(progress));
    return () => { ipcRenderer.removeAllListeners('scan-progress'); };
  },

  // Wake-on-LAN
  sendWol: (mac: string, broadcast?: string): Promise<boolean> =>
    ipcRenderer.invoke('send-wol', mac, broadcast),

  // Speed test
  runSpeedTest: (): Promise<SpeedTestResult> =>
    ipcRenderer.invoke('run-speed-test'),

  // Traceroute
  runTraceroute: (host: string): Promise<TracerouteHop[]> =>
    ipcRenderer.invoke('run-traceroute', host),

  // Bandwidth monitor
  getBandwidth: (iface?: string): Promise<BandwidthSnapshot> =>
    ipcRenderer.invoke('get-bandwidth', iface),

  // mDNS
  discoverMdns: (): Promise<MdnsService[]> =>
    ipcRenderer.invoke('discover-mdns'),

  // Ping monitor
  pingSingle: (host: string): Promise<PingResult> =>
    ipcRenderer.invoke('ping-single', host),

  // DNS lookup
  dnsLookup: (domain: string): Promise<DnsRecord[]> =>
    ipcRenderer.invoke('dns-lookup', domain),

  // Subnet calculator
  calculateSubnet: (cidr: string): Promise<SubnetInfo | null> =>
    ipcRenderer.invoke('calculate-subnet', cidr),

  // Device history
  getDeviceHistory: (): Promise<DeviceHistoryEntry[]> =>
    ipcRenderer.invoke('get-device-history'),
  updateDeviceHistory: (devices: NetworkDevice[]): Promise<DeviceHistoryEntry[]> =>
    ipcRenderer.invoke('update-device-history', devices),

  // Export
  exportCsv: (devices: NetworkDevice[], ports?: PortResult[]): Promise<string> =>
    ipcRenderer.invoke('export-csv', devices, ports),
  exportJson: (devices: NetworkDevice[], ports?: PortResult[]): Promise<string> =>
    ipcRenderer.invoke('export-json', devices, ports),

  // Favorites
  getFavorites: (): Promise<FavoriteHost[]> =>
    ipcRenderer.invoke('get-favorites'),
  saveFavorite: (fav: FavoriteHost): Promise<FavoriteHost[]> =>
    ipcRenderer.invoke('save-favorite', fav),
  removeFavorite: (ip: string): Promise<FavoriteHost[]> =>
    ipcRenderer.invoke('remove-favorite', ip),

  // Theme
  getTheme: (): Promise<string> =>
    ipcRenderer.invoke('get-theme'),
  setTheme: (theme: string): Promise<void> =>
    ipcRenderer.invoke('set-theme', theme),

  // File dialogs
  saveFile: (content: string, defaultName: string): Promise<boolean> =>
    ipcRenderer.invoke('save-file', content, defaultName),
};

contextBridge.exposeInMainWorld('netscan', api);
