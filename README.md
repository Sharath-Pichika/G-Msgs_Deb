# Google Messages Desktop

An Electron desktop wrapper for Google Messages Web, packaged for Debian-based Linux distributions.

## Features

- Runs as a native desktop app
- Custom app icon and dock support
- Secure sandboxed architecture

## Requirements

- Node.js 22+
- Debian-based Linux (Pop!_OS, Ubuntu, Debian, etc.)

## Install from .deb (Recommended)

Download `gmsgs_1.1.0_amd64.deb` from the [Releases page](https://github.com/Sharath-Pichika/G-Msgs_Deb/releases), then:

```bash
sudo dpkg -i gmsgs_1.1.0_amd64.deb
sudo apt install -f
```

## Run from source

```bash
git clone https://github.com/Sharath-Pichika/G-Msgs_Deb.git
cd G-Msgs_Deb
npm install
npm start
```

## Build your own .deb

```bash
npm install
npm run dist
```
The installer will be created at dist/gmsgs_1.1.0_amd64.deb

## Notes

- Launches with --ozone-platform=x11 for compatibility on Pop!_OS 
