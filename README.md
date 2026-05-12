# NetScan

A modern desktop network scanner and toolkit built with Electron, React, and TypeScript.

![NetScan](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Discovery
- **Device Discovery** — Scan your local network to find all connected devices
- **Port Scanning** — Check open ports on any device with custom port ranges
- **mDNS/Bonjour** — Discover services advertised on the network
- **Device History** — Track devices over time, see when they appear/disappear

### Tools
- **Speed Test** — Measure download/upload speed and latency
- **Ping Monitor** — Continuous ping with live latency graph
- **Traceroute** — Visualize the hop-by-hop path to any host
- **DNS Lookup** — Query A, AAAA, MX, CNAME, NS, TXT records
- **Subnet Calculator** — Compute network/broadcast/host ranges from CIDR notation

### Monitor
- **Bandwidth Monitor** — Real-time download/upload graph per interface
- **Network Interfaces** — View all interfaces and their configuration

### Utilities
- **Wake-on-LAN** — Send magic packets to wake sleeping devices
- **Export** — Save scan results as CSV or JSON
- **Favorites** — Pin frequently accessed hosts
- **Dark/Light Theme** — Toggle between dark and light mode
- **System Tray** — Minimize to tray, quick scan from the tray menu

## Tech Stack

- **Electron** — Cross-platform desktop framework
- **React 18** — UI library
- **TypeScript** — Type-safe code
- **Vite** — Fast build tooling
- **electron-builder** — Release packaging (AppImage, DMG, NSIS)

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
git clone https://github.com/epivz/netscan.git
cd netscan
npm install
```

### Development

```bash
npm run dev
```

This starts both the Vite dev server (renderer) and the Electron main process.

### Build

```bash
npm run build
```

### Package

```bash
# All platforms
npm run package

# Platform-specific
npm run package:linux   # AppImage + deb
npm run package:mac     # DMG + zip
npm run package:win     # NSIS installer + portable
```

### Release

Push a version tag to trigger the CI release workflow:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This builds for Linux, macOS, and Windows and creates a GitHub Release with all artifacts.

## Architecture

```
src/
├── main/                  # Electron main process
│   ├── main.ts            # Window, tray, IPC handlers
│   ├── preload.ts         # Context bridge (secure API)
│   └── scanner.ts         # Network scanning & tools logic
└── renderer/              # React frontend
    ├── App.tsx             # Sidebar navigation + view router
    ├── components/
    │   ├── Header.tsx          # Top bar (scan button, theme toggle)
    │   ├── DeviceList.tsx      # Device cards with WoL & favorites
    │   ├── PortScanner.tsx     # Port scan with custom ranges
    │   ├── NetworkInfo.tsx     # Interface details
    │   ├── SpeedTest.tsx       # Download/upload/ping test
    │   ├── PingMonitor.tsx     # Live latency graph
    │   ├── Traceroute.tsx      # Hop-by-hop visualization
    │   ├── BandwidthMonitor.tsx # Real-time bandwidth graph
    │   ├── MdnsDiscovery.tsx   # mDNS service browser
    │   ├── DnsLookup.tsx       # DNS record query
    │   ├── SubnetCalculator.tsx # CIDR calculator
    │   └── DeviceHistory.tsx   # Historical device tracking
    ├── styles/
    │   └── global.css          # Dark + light theme variables
    └── types.d.ts              # TypeScript interfaces
```

## How It Works

1. **Device Discovery**: Sends ICMP ping to all IPs in the local subnet (x.x.x.1–254), then reads the ARP table for MAC addresses
2. **Vendor Lookup**: Matches MAC address OUI prefixes against a built-in database
3. **Port Scanning**: TCP connect scan with configurable port ranges and timeout detection
4. **Speed Test**: Uses Cloudflare's speed test endpoint via curl for download/upload measurements
5. **Bandwidth Monitor**: Reads `/sys/class/net/` counters (Linux) or `netstat -ib` (macOS) at 1-second intervals
6. **Wake-on-LAN**: Constructs and broadcasts UDP magic packets on port 9

## Security

- Uses Electron's context isolation and disabled node integration in the renderer
- All network operations happen in the main process via IPC
- No data leaves your machine — everything runs locally
- Device history and favorites stored locally in `~/.netscan-*.json`

## License

MIT
