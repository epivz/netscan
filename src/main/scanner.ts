import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as net from 'net';

const execAsync = promisify(exec);

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

const COMMON_PORTS: Record<number, string> = {
  20: 'FTP Data',
  21: 'FTP',
  22: 'SSH',
  23: 'Telnet',
  25: 'SMTP',
  53: 'DNS',
  80: 'HTTP',
  110: 'POP3',
  143: 'IMAP',
  443: 'HTTPS',
  445: 'SMB',
  993: 'IMAPS',
  995: 'POP3S',
  3306: 'MySQL',
  3389: 'RDP',
  5432: 'PostgreSQL',
  5900: 'VNC',
  6379: 'Redis',
  8080: 'HTTP Alt',
  8443: 'HTTPS Alt',
  9090: 'Web Admin',
  27017: 'MongoDB',
};

const OUI_PREFIXES: Record<string, string> = {
  '00:50:56': 'VMware',
  '00:0C:29': 'VMware',
  '00:1A:11': 'Google',
  '3C:5A:B4': 'Google',
  'AC:67:B2': 'Apple',
  '00:1B:63': 'Apple',
  'F8:FF:C2': 'Apple',
  '00:03:93': 'Apple',
  '98:01:A7': 'Apple',
  'DC:A6:32': 'Raspberry Pi',
  'B8:27:EB': 'Raspberry Pi',
  '00:15:5D': 'Microsoft Hyper-V',
  '00:1A:A0': 'Dell',
  '00:25:B5': 'Dell',
  'F0:1F:AF': 'Dell',
  '00:21:5A': 'HP',
  '3C:D9:2B': 'HP',
  '00:26:55': 'Cisco',
  '00:1E:BD': 'Cisco',
  '00:50:F2': 'Microsoft',
  '00:0D:3A': 'Microsoft',
  '08:00:27': 'VirtualBox',
  '52:54:00': 'QEMU/KVM',
  '00:16:3E': 'Xen',
  '00:1C:42': 'Parallels',
  'AA:BB:CC': 'Private',
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
          // Normalize MAC to uppercase with colons
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

export async function scanNetwork(subnet?: string): Promise<NetworkDevice[]> {
  const targetSubnet = subnet || getLocalSubnet();
  if (!targetSubnet) {
    return [];
  }

  const devices: NetworkDevice[] = [];
  const batchSize = 25;

  // First, do a batch ping to populate ARP table
  const pingPromises: Promise<{ ip: string; alive: boolean; latency: number }>[] = [];
  for (let i = 1; i <= 254; i++) {
    const ip = `${targetSubnet}.${i}`;
    pingPromises.push(
      pingHost(ip).then(result => ({ ip, ...result }))
    );

    // Process in batches to avoid overwhelming the system
    if (pingPromises.length >= batchSize || i === 254) {
      const results = await Promise.all(pingPromises);
      pingPromises.length = 0;

      for (const result of results) {
        if (result.alive) {
          devices.push({
            ip: result.ip,
            mac: 'unknown',
            hostname: '',
            vendor: 'Unknown',
            latency: result.latency,
          });
        }
      }
    }
  }

  // Get ARP table for MAC addresses
  const arpTable = await getArpTable();

  // Enrich device data
  const enrichPromises = devices.map(async (device) => {
    // Get MAC from ARP table
    const mac = arpTable.get(device.ip) || 'unknown';
    device.mac = mac;
    device.vendor = lookupVendor(mac);

    // Resolve hostname
    device.hostname = await resolveHostname(device.ip);

    return device;
  });

  await Promise.all(enrichPromises);

  // Sort by IP
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

export async function scanPorts(host: string, ports?: number[]): Promise<PortResult[]> {
  const targetPorts = ports || Object.keys(COMMON_PORTS).map(Number);
  const results: PortResult[] = [];

  const scanPort = (port: number): Promise<PortResult> => {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2000);

      socket.on('connect', () => {
        socket.destroy();
        resolve({
          port,
          state: 'open',
          service: COMMON_PORTS[port] || 'Unknown',
        });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          port,
          state: 'filtered',
          service: COMMON_PORTS[port] || 'Unknown',
        });
      });

      socket.on('error', () => {
        socket.destroy();
        resolve({
          port,
          state: 'closed',
          service: COMMON_PORTS[port] || 'Unknown',
        });
      });

      socket.connect(port, host);
    });
  };

  // Scan in batches
  const batchSize = 50;
  for (let i = 0; i < targetPorts.length; i += batchSize) {
    const batch = targetPorts.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(scanPort));
    results.push(...batchResults);
  }

  return results.sort((a, b) => a.port - b.port);
}

export function getNetworkInterfaces(): NetworkInterface[] {
  const interfaces = os.networkInterfaces();
  const result: NetworkInterface[] = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === 'IPv4') {
        result.push({
          name,
          ip: addr.address,
          mac: addr.mac,
          netmask: addr.netmask,
          family: addr.family,
          internal: addr.internal,
        });
      }
    }
  }

  return result;
}
