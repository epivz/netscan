# NetScan

A modern desktop network scanner utility built with Electron, React, and TypeScript.

![NetScan](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Device Discovery** — Scan your local network to find all connected devices
- **Port Scanning** — Check open ports on any discovered device
- **Network Info** — View all network interfaces and their configuration
- **Vendor Detection** — Identify device manufacturers from MAC addresses
- **Latency Monitoring** — See response times for all discovered devices
- **Modern UI** — Clean dark-themed interface with smooth animations

## Tech Stack

- **Electron** — Cross-platform desktop framework
- **React 18** — UI library
- **TypeScript** — Type-safe code
- **Vite** — Fast build tooling

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
npm run package
```

Creates distributable packages for your current platform.

## Architecture

```
src/
├── main/           # Electron main process
│   ├── main.ts     # Window management, IPC handlers
│   ├── preload.ts  # Context bridge (secure API exposure)
│   └── scanner.ts  # Network scanning logic
└── renderer/       # React frontend
    ├── App.tsx
    ├── components/
    │   ├── Header.tsx
    │   ├── DeviceList.tsx
    │   ├── PortScanner.tsx
    │   └── NetworkInfo.tsx
    ├── styles/
    │   └── global.css
    └── types.d.ts
```

## How It Works

1. **Device Discovery**: Sends ICMP ping to all IPs in the local subnet (x.x.x.1–254), then reads the ARP table for MAC addresses
2. **Vendor Lookup**: Matches MAC address OUI prefixes against a built-in database
3. **Port Scanning**: Attempts TCP connections to common ports with timeout detection
4. **Hostname Resolution**: Uses reverse DNS lookup to resolve device hostnames

## Security

- Uses Electron's context isolation and disabled node integration in the renderer
- All network operations happen in the main process via IPC
- No data leaves your machine — everything runs locally

## License

MIT
