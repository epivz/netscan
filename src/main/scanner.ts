import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as net from 'net';
import * as dgram from 'dgram';
import * as dns from 'dns';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);
const dnsResolve4 = promisify(dns.resolve4);
const dnsResolve6 = promisify(dns.resolve6);
const dnsResolveMx = promisify(dns.resolveMx);
const dnsResolveCname = promisify(dns.resolveCname);
const dnsResolveTxt = promisify(dns.resolveTxt);
const dnsResolveNs = promisify(dns.resolveNs);

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

const COMMON_PORTS: Record<number, string> = {
  20: 'FTP Data', 21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP',
  53: 'DNS', 80: 'HTTP', 110: 'POP3', 143: 'IMAP', 443: 'HTTPS',
  445: 'SMB', 993: 'IMAPS', 995: 'POP3S', 3306: 'MySQL', 3389: 'RDP',
  5432: 'PostgreSQL', 5900: 'VNC', 6379: 'Redis', 8080: 'HTTP Alt',
  8443: 'HTTPS Alt', 9090: 'Web Admin', 27017: 'MongoDB',
};

const OUI_PREFIXES: Record<string, string> = {
  '00:50:56': 'VMware', '00:0C:29': 'VMware',
  '00:1A:11': 'Google', '3C:5A:B4': 'Google',
  'AC:67:B2': 'Apple', '00:1B:63': 'Apple', 'F8:FF:C2': 'Apple',
  '00:03:93': 'Apple', '98:01:A7': 'Apple',
  'DC:A6:32': 'Raspberry Pi', 'B8:27:EB': 'Raspberry Pi',
  '00:15:5D': 'Microsoft Hyper-V',
  '00:1A:A0': 'Dell', '00:25:B5': 'Dell', 'F0:1F:AF': 'Dell',
  '00:21:5A': 'HP', '3C:D9:2B': 'HP',
  '00:26:55': 'Cisco', '00:1E:BD': 'Cisco',
  '00:50:F2': 'Microsoft', '00:0D:3A': 'Microsoft',
  '08:00:27': 'VirtualBox', '52:54:00': 'QEMU/KVM',
  '00:16:3E': 'Xen', '00:1C:42': 'Parallels', 'AA:BB:CC': 'Private',
};

function lookupVendor(mac: string): string {
  if (!mac || mac === 'unknown') return 'Unknown';
  const prefix = mac.substring(0, 8).toUpperCase();
  return OUI_PREFIXES[prefix] || 'Unknown';
}

function getLocalSubnet(): string | null {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        const parts = addr.address.split('.');
        return `${parts[0]}.${parts[1]}.${parts[2]}`;
      }
    }
  }
  return null;
}

async function pingHost(ip: string): Promise<{ alive: boolean; latency: number }> {
  const start = Date.now();
  try {
    const cmd = process.platform === 'win32'
      ? `ping -n 1 -w 1000 ${ip}`
      : `ping -c 1 -W 1 ${ip}`;
    await execAsync(cmd, { timeout: 3000 });
    return { alive: true, latency: Date.now() - start };
  } catch {
    return { alive: false, latency: -1 };
  }
}

async function getArpTable(): Promise<Map<string, string>> {
  const macMap = new Map<string, string>();
  try {
    const cmd = process.platform === 'win32' ? 'arp -a' : 'arp -an';
    const { stdout } = await execAsync(cmd, { timeout: 5000 });
    const lines = stdout.split('\n');
    for (const line of lines) {
      const match = line.match(/\(?([\d.]+)\)?\s+(?:at\s+)?([\da-fA-F:.-]+)/);
      if (match) {
        const ip = match[1];
        let mac = match[2].replace(/-/g, ':').toLowerCase();
        if (mac && mac !== '(incomplete)' && mac !== 'ff:ff:ff:ff:ff:ff') {
          mac = mac.split(':').map(p => p.padStart(2, '0')).join(':').toUpperCase();
          macMap.set(ip, mac);
        }
      }
    }
  } catch {
    // ARP table may not be available
  }
  return macMap;
}

async function resolveHostname(ip: string): Promise<string> {
  try {
    const cmd = process.platform === 'win32'
      ? `nslookup ${ip}`
      : `host ${ip}`;
    const { stdout } = await execAsync(cmd, { timeout: 3000 });
    if (process.platform === 'win32') {
      const match = stdout.match(/Name:\s+(.+)/);
      return match ? match[1].trim() : '';
    } else {
      const match = stdout.match(/pointer\s+(.+)\./);
      return match ? match[1].trim() : '';
    }
  } catch {
    return '';
  }
}

// ─── Network Scan ───

export async function scanNetwork(subnet?: string): Promise<NetworkDevice[]> {
  const targetSubnet = subnet || getLocalSubnet();
  if (!targetSubnet) return [];

  const devices: NetworkDevice[] = [];
  const batchSize = 25;
  const pingPromises: Promise<{ ip: string; alive: boolean; latency: number }>[] = [];

  for (let i = 1; i <= 254; i++) {
    const ip = `${targetSubnet}.${i}`;
    pingPromises.push(pingHost(ip).then(result => ({ ip, ...result })));

    if (pingPromises.length >= batchSize || i === 254) {
      const results = await Promise.all(pingPromises);
      pingPromises.length = 0;
      for (const result of results) {
        if (result.alive) {
          devices.push({
            ip: result.ip, mac: 'unknown', hostname: '',
            vendor: 'Unknown', latency: result.latency,
          });
        }
      }
    }
  }

  const arpTable = await getArpTable();
  const enrichPromises = devices.map(async (device) => {
    const mac = arpTable.get(device.ip) || 'unknown';
    device.mac = mac;
    device.vendor = lookupVendor(mac);
    device.hostname = await resolveHostname(device.ip);
    return device;
  });
  await Promise.all(enrichPromises);

  devices.sort((a, b) => {
    const partsA = a.ip.split('.').map(Number);
    const partsB = b.ip.split('.').map(Number);
    for (let i = 0; i < 4; i++) {
      if (partsA[i] !== partsB[i]) return partsA[i] - partsB[i];
    }
    return 0;
  });

  return devices;
}

// ─── Port Scan ───

export async function scanPorts(host: string, ports?: number[]): Promise<PortResult[]> {
  const targetPorts = ports || Object.keys(COMMON_PORTS).map(Number);
  const results: PortResult[] = [];

  const scanPort = (port: number): Promise<PortResult> => {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2000);
      socket.on('connect', () => {
        socket.destroy();
        resolve({ port, state: 'open', service: COMMON_PORTS[port] || 'Unknown' });
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve({ port, state: 'filtered', service: COMMON_PORTS[port] || 'Unknown' });
      });
      socket.on('error', () => {
        socket.destroy();
        resolve({ port, state: 'closed', service: COMMON_PORTS[port] || 'Unknown' });
      });
      socket.connect(port, host);
    });
  };

  const batchSize = 50;
  for (let i = 0; i < targetPorts.length; i += batchSize) {
    const batch = targetPorts.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(scanPort));
    results.push(...batchResults);
  }

  return results.sort((a, b) => a.port - b.port);
}

export function parsePortRange(rangeStr: string): number[] {
  const ports: Set<number> = new Set();
  const parts = rangeStr.split(',').map(s => s.trim());
  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map(s => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end) && Math.min(start, end) > 0 && Math.max(start, end) <= 65535) {
        for (let p = Math.min(start, end); p <= Math.max(start, end); p++) {
          ports.add(p);
        }
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p > 0 && p <= 65535) ports.add(p);
    }
  }
  return Array.from(ports).sort((a, b) => a - b);
}

// ─── Network Interfaces ───

export function getNetworkInterfaces(): NetworkInterface[] {
  const interfaces = os.networkInterfaces();
  const result: NetworkInterface[] = [];
  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === 'IPv4') {
        result.push({
          name, ip: addr.address, mac: addr.mac,
          netmask: addr.netmask, family: addr.family, internal: addr.internal,
        });
      }
    }
  }
  return result;
}

// ─── Wake-on-LAN ───

export async function sendWakeOnLan(macAddress: string, broadcastAddr?: string): Promise<boolean> {
  const mac = macAddress.replace(/[:-]/g, '');
  if (mac.length !== 12) return false;

  const macBytes = Buffer.alloc(6);
  for (let i = 0; i < 6; i++) {
    macBytes[i] = parseInt(mac.substring(i * 2, i * 2 + 2), 16);
  }

  const magicPacket = Buffer.alloc(102);
  magicPacket.fill(0xFF, 0, 6);
  for (let i = 0; i < 16; i++) {
    macBytes.copy(magicPacket, 6 + i * 6);
  }

  const broadcast = broadcastAddr || '255.255.255.255';

  return new Promise((resolve) => {
    const socket = dgram.createSocket('udp4');
    socket.once('error', () => { socket.close(); resolve(false); });
    socket.bind(() => {
      socket.setBroadcast(true);
      socket.send(magicPacket, 0, magicPacket.length, 9, broadcast, (err) => {
        socket.close();
        resolve(!err);
      });
    });
  });
}

// ─── Speed Test ───

export async function runSpeedTest(): Promise<SpeedTestResult> {
  const server = 'speed.cloudflare.com';
  const timestamp = Date.now();

  // Ping test
  const pingStart = Date.now();
  try {
    await execAsync(`ping -c 3 -W 2 ${server}`, { timeout: 10000 });
  } catch { /* ok */ }
  const pingTime = Math.round((Date.now() - pingStart) / 3);

  // Download test using curl (100MB test file)
  let downloadSpeed = 0;
  try {
    const dlStart = Date.now();
    await execAsync(
      `curl -o /dev/null -w "%{speed_download}" --max-time 10 "https://${server}/__down?bytes=10000000"`,
      { timeout: 15000 }
    );
    const dlTime = (Date.now() - dlStart) / 1000;
    downloadSpeed = Math.round((10000000 * 8) / dlTime / 1000000 * 100) / 100; // Mbps
  } catch (err) {
    try {
      const { stdout } = await execAsync(
        `curl -o /dev/null -s -w "%{speed_download}" --max-time 10 "https://${server}/__down?bytes=5000000"`,
        { timeout: 15000 }
      );
      downloadSpeed = Math.round(parseFloat(stdout) * 8 / 1000000 * 100) / 100;
    } catch { /* download test failed */ }
  }

  // Upload test
  let uploadSpeed = 0;
  try {
    const { stdout } = await execAsync(
      `dd if=/dev/zero bs=1M count=2 2>/dev/null | curl -X POST -s -w "%{speed_upload}" --data-binary @- --max-time 10 "https://${server}/__up"`,
      { timeout: 15000 }
    );
    uploadSpeed = Math.round(parseFloat(stdout) * 8 / 1000000 * 100) / 100;
  } catch { /* upload test failed */ }

  return { downloadSpeed, uploadSpeed, ping: pingTime, server, timestamp };
}

// ─── Traceroute ───

export async function runTraceroute(host: string): Promise<TracerouteHop[]> {
  const hops: TracerouteHop[] = [];
  try {
    const cmd = process.platform === 'win32'
      ? `tracert -d -w 2000 -h 30 ${host}`
      : `traceroute -n -w 2 -m 30 ${host}`;
    const { stdout } = await execAsync(cmd, { timeout: 60000 });

    const lines = stdout.split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*(\d+)\s+(.+)/);
      if (!match) continue;
      const hop = parseInt(match[1], 10);
      const rest = match[2];

      const times: number[] = [];
      let ip = '*';

      const ipMatch = rest.match(/([\d.]+)/);
      if (ipMatch) ip = ipMatch[1];

      const timeMatches = rest.matchAll(/([\d.]+)\s*ms/g);
      for (const tm of timeMatches) {
        times.push(parseFloat(tm[1]));
      }

      let hostname = '';
      if (ip !== '*') {
        try { hostname = await resolveHostname(ip); } catch { /* ok */ }
      }

      hops.push({
        hop, ip, hostname,
        rtt1: times[0] ?? -1,
        rtt2: times[1] ?? -1,
        rtt3: times[2] ?? -1,
      });
    }
  } catch { /* traceroute failed */ }
  return hops;
}

// ─── Bandwidth Monitor ───

let lastBandwidth: { rx: number; tx: number; time: number } | null = null;

export async function getBandwidthSnapshot(ifaceName?: string): Promise<BandwidthSnapshot> {
  const iface = ifaceName || 'eth0';
  let rxBytes = 0;
  let txBytes = 0;

  try {
    if (process.platform === 'linux') {
      const rxData = fs.readFileSync(`/sys/class/net/${iface}/statistics/rx_bytes`, 'utf8');
      const txData = fs.readFileSync(`/sys/class/net/${iface}/statistics/tx_bytes`, 'utf8');
      rxBytes = parseInt(rxData.trim(), 10);
      txBytes = parseInt(txData.trim(), 10);
    } else {
      const { stdout } = await execAsync('netstat -ib', { timeout: 5000 });
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes(iface)) {
          const parts = line.split(/\s+/);
          rxBytes = parseInt(parts[6], 10) || 0;
          txBytes = parseInt(parts[9], 10) || 0;
          break;
        }
      }
    }
  } catch { /* stats unavailable */ }

  const now = Date.now();
  let rxRate = 0;
  let txRate = 0;

  if (lastBandwidth) {
    const elapsed = (now - lastBandwidth.time) / 1000;
    if (elapsed > 0) {
      rxRate = Math.round((rxBytes - lastBandwidth.rx) / elapsed);
      txRate = Math.round((txBytes - lastBandwidth.tx) / elapsed);
    }
  }

  lastBandwidth = { rx: rxBytes, tx: txBytes, time: now };

  return { timestamp: now, rxBytes, txBytes, rxRate: Math.max(0, rxRate), txRate: Math.max(0, txRate), iface };
}

// ─── mDNS/Bonjour Discovery ───

export async function discoverMdnsServices(): Promise<MdnsService[]> {
  const services: MdnsService[] = [];
  try {
    const { stdout } = await execAsync(
      'avahi-browse -apt --no-db-lookup 2>/dev/null || dns-sd -Z _services._dns-sd._udp local. 2>/dev/null',
      { timeout: 10000 }
    );
    const lines = stdout.split('\n');
    for (const line of lines) {
      if (line.startsWith('+') || line.startsWith('=')) {
        const parts = line.split(';');
        if (parts.length >= 5) {
          const name = parts[3] || 'Unknown';
          const type = parts[4] || '';
          const host = parts.length > 6 ? parts[6] : '';
          const ip = parts.length > 7 ? parts[7] : '';
          const port = parts.length > 8 ? parseInt(parts[8], 10) : 0;
          services.push({ name, type, host, ip, port: port || 0, txt: {} });
        }
      }
    }
  } catch { /* mDNS not available */ }
  return services;
}

// ─── Ping Monitor ───

export async function pingSingle(host: string): Promise<PingResult> {
  const timestamp = Date.now();
  try {
    const cmd = process.platform === 'win32'
      ? `ping -n 1 -w 2000 ${host}`
      : `ping -c 1 -W 2 ${host}`;
    const { stdout } = await execAsync(cmd, { timeout: 5000 });
    const timeMatch = stdout.match(/time[=<]([\d.]+)/);
    const time = timeMatch ? parseFloat(timeMatch[1]) : Date.now() - timestamp;
    return { seq: 0, time, alive: true, timestamp };
  } catch {
    return { seq: 0, time: -1, alive: false, timestamp };
  }
}

// ─── DNS Lookup ───

export async function dnsLookup(domain: string): Promise<DnsRecord[]> {
  const records: DnsRecord[] = [];

  try {
    const a = await dnsResolve4(domain);
    for (const ip of a) records.push({ type: 'A', value: ip });
  } catch { /* no A records */ }

  try {
    const aaaa = await dnsResolve6(domain);
    for (const ip of aaaa) records.push({ type: 'AAAA', value: ip });
  } catch { /* no AAAA records */ }

  try {
    const mx = await dnsResolveMx(domain);
    for (const m of mx) records.push({ type: 'MX', value: m.exchange, priority: m.priority });
  } catch { /* no MX records */ }

  try {
    const cname = await dnsResolveCname(domain);
    for (const c of cname) records.push({ type: 'CNAME', value: c });
  } catch { /* no CNAME records */ }

  try {
    const ns = await dnsResolveNs(domain);
    for (const n of ns) records.push({ type: 'NS', value: n });
  } catch { /* no NS records */ }

  try {
    const txt = await dnsResolveTxt(domain);
    for (const t of txt) records.push({ type: 'TXT', value: t.join(' ') });
  } catch { /* no TXT records */ }

  return records;
}

// ─── Subnet Calculator ───

export function calculateSubnet(cidrStr: string): SubnetInfo | null {
  const match = cidrStr.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
  if (!match) return null;

  const ip = match[1];
  const cidr = parseInt(match[2], 10);
  if (cidr < 0 || cidr > 32) return null;

  const ipNum = ipToNumber(ip);
  const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  const network = (ipNum & mask) >>> 0;
  const broadcast = (network | ~mask) >>> 0;
  const wildcard = (~mask) >>> 0;
  const totalHosts = Math.pow(2, 32 - cidr);
  const usableHosts = cidr >= 31 ? totalHosts : Math.max(0, totalHosts - 2);

  return {
    networkAddress: numberToIp(network),
    broadcastAddress: numberToIp(broadcast),
    firstUsable: cidr >= 31 ? numberToIp(network) : numberToIp(network + 1),
    lastUsable: cidr >= 31 ? numberToIp(broadcast) : numberToIp(broadcast - 1),
    totalHosts,
    usableHosts,
    netmask: numberToIp(mask),
    cidr,
    wildcardMask: numberToIp(wildcard),
  };
}

function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function numberToIp(num: number): string {
  return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
}

// ─── Device History ───

const HISTORY_FILE = path.join(os.homedir(), '.netscan-history.json');

export function loadDeviceHistory(): DeviceHistoryEntry[] {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
  } catch { /* corrupt file */ }
  return [];
}

export function saveDeviceHistory(history: DeviceHistoryEntry[]): void {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

export function updateDeviceHistory(currentDevices: NetworkDevice[]): DeviceHistoryEntry[] {
  const history = loadDeviceHistory();
  const now = Date.now();
  const currentIps = new Set(currentDevices.map(d => d.ip));

  for (const device of currentDevices) {
    const existing = history.find(h => (h.mac !== 'unknown' && h.mac === device.mac) || h.ip === device.ip);
    if (existing) {
      existing.lastSeen = now;
      existing.status = 'online';
      existing.ip = device.ip;
      existing.hostname = device.hostname || existing.hostname;
    } else {
      history.push({
        ip: device.ip, mac: device.mac, hostname: device.hostname,
        vendor: device.vendor, firstSeen: now, lastSeen: now, status: 'online',
      });
    }
  }

  for (const entry of history) {
    if (!currentIps.has(entry.ip)) {
      entry.status = 'offline';
    }
  }

  saveDeviceHistory(history);
  return history;
}

// ─── Export ───

export function exportToCsv(devices: NetworkDevice[], portResults?: PortResult[]): string {
  let csv = 'IP,MAC,Hostname,Vendor,Latency (ms)\n';
  for (const d of devices) {
    csv += `"${d.ip}","${d.mac}","${d.hostname}","${d.vendor}",${d.latency}\n`;
  }

  if (portResults && portResults.length > 0) {
    csv += '\nPort,Service,State\n';
    for (const p of portResults) {
      csv += `${p.port},"${p.service}","${p.state}"\n`;
    }
  }

  return csv;
}

export function exportToJson(devices: NetworkDevice[], portResults?: PortResult[]): string {
  return JSON.stringify({ devices, portResults: portResults || [], exportedAt: new Date().toISOString() }, null, 2);
}

// ─── Favorites ───

const FAVORITES_FILE = path.join(os.homedir(), '.netscan-favorites.json');

export interface FavoriteHost {
  ip: string;
  label: string;
  mac?: string;
  addedAt: number;
}

export function loadFavorites(): FavoriteHost[] {
  try {
    if (fs.existsSync(FAVORITES_FILE)) {
      return JSON.parse(fs.readFileSync(FAVORITES_FILE, 'utf8'));
    }
  } catch { /* corrupt */ }
  return [];
}

export function saveFavorite(fav: FavoriteHost): FavoriteHost[] {
  const favorites = loadFavorites();
  const existing = favorites.findIndex(f => f.ip === fav.ip);
  if (existing >= 0) {
    favorites[existing] = fav;
  } else {
    favorites.push(fav);
  }
  fs.writeFileSync(FAVORITES_FILE, JSON.stringify(favorites, null, 2));
  return favorites;
}

export function removeFavorite(ip: string): FavoriteHost[] {
  const favorites = loadFavorites().filter(f => f.ip !== ip);
  fs.writeFileSync(FAVORITES_FILE, JSON.stringify(favorites, null, 2));
  return favorites;
}
