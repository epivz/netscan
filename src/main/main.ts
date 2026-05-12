import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {
  scanNetwork, scanPorts, parsePortRange, getNetworkInterfaces,
  sendWakeOnLan, runSpeedTest, runTraceroute, getBandwidthSnapshot,
  discoverMdnsServices, pingSingle, dnsLookup, calculateSubnet,
  loadDeviceHistory, updateDeviceHistory,
  exportToCsv, exportToJson,
  loadFavorites, saveFavorite, removeFavorite,
} from './scanner';
import type { NetworkDevice, PortResult, FavoriteHost } from './scanner';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const THEME_FILE = path.join(os.homedir(), '.netscan-theme.json');

function getStoredTheme(): string {
  try {
    if (fs.existsSync(THEME_FILE)) {
      return JSON.parse(fs.readFileSync(THEME_FILE, 'utf8')).theme || 'dark';
    }
  } catch { /* default */ }
  return 'dark';
}

function setStoredTheme(theme: string): void {
  fs.writeFileSync(THEME_FILE, JSON.stringify({ theme }));
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: getStoredTheme() === 'dark' ? '#0f0f14' : '#f5f5f8',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('close', (event) => {
    if (tray) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray(): void {
  const iconSize = 16;
  const icon = nativeImage.createEmpty();
  const canvas = Buffer.alloc(iconSize * iconSize * 4);
  for (let i = 0; i < iconSize * iconSize; i++) {
    canvas[i * 4] = 108;     // R
    canvas[i * 4 + 1] = 99;  // G
    canvas[i * 4 + 2] = 255; // B
    canvas[i * 4 + 3] = 255; // A
  }
  const trayIcon = nativeImage.createFromBuffer(canvas, { width: iconSize, height: iconSize });

  tray = new Tray(icon.isEmpty() ? trayIcon : icon);
  tray.setToolTip('NetScan');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show NetScan', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { label: 'Quick Scan', click: () => { mainWindow?.show(); mainWindow?.webContents.send('trigger-scan'); } },
    { type: 'separator' },
    { label: 'Quit', click: () => { tray?.destroy(); tray = null; app.quit(); } },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !tray) {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

// ─── IPC Handlers ───

// Original
ipcMain.handle('scan-network', async (_event, subnet?: string) => scanNetwork(subnet));
ipcMain.handle('scan-ports', async (_event, host: string, ports?: number[]) => scanPorts(host, ports));
ipcMain.handle('get-interfaces', async () => getNetworkInterfaces());

// Wake-on-LAN
ipcMain.handle('send-wol', async (_event, mac: string, broadcast?: string) => sendWakeOnLan(mac, broadcast));

// Speed test
ipcMain.handle('run-speed-test', async () => runSpeedTest());

// Traceroute
ipcMain.handle('run-traceroute', async (_event, host: string) => runTraceroute(host));

// Bandwidth
ipcMain.handle('get-bandwidth', async (_event, iface?: string) => getBandwidthSnapshot(iface));

// mDNS
ipcMain.handle('discover-mdns', async () => discoverMdnsServices());

// Ping
ipcMain.handle('ping-single', async (_event, host: string) => pingSingle(host));

// DNS
ipcMain.handle('dns-lookup', async (_event, domain: string) => dnsLookup(domain));

// Subnet
ipcMain.handle('calculate-subnet', async (_event, cidr: string) => calculateSubnet(cidr));

// History
ipcMain.handle('get-device-history', async () => loadDeviceHistory());
ipcMain.handle('update-device-history', async (_event, devices: NetworkDevice[]) => updateDeviceHistory(devices));

// Export
ipcMain.handle('export-csv', async (_event, devices: NetworkDevice[], ports?: PortResult[]) => exportToCsv(devices, ports));
ipcMain.handle('export-json', async (_event, devices: NetworkDevice[], ports?: PortResult[]) => exportToJson(devices, ports));

// Favorites
ipcMain.handle('get-favorites', async () => loadFavorites());
ipcMain.handle('save-favorite', async (_event, fav: FavoriteHost) => saveFavorite(fav));
ipcMain.handle('remove-favorite', async (_event, ip: string) => removeFavorite(ip));

// Theme
ipcMain.handle('get-theme', async () => getStoredTheme());
ipcMain.handle('set-theme', async (_event, theme: string) => { setStoredTheme(theme); });

// File save dialog
ipcMain.handle('save-file', async (_event, content: string, defaultName: string) => {
  if (!mainWindow) return false;
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [
      { name: 'CSV', extensions: ['csv'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (filePath) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
});

// Port range parsing (expose for renderer)
ipcMain.handle('parse-port-range', async (_event, range: string) => parsePortRange(range));
