# OneAI — Minimal Electron App

OneAI is a minimal Electron desktop application built for Windows. 

## Project summary

- Project: OneAI
- Description: Minimal Electron app for OneAI
- Version: 0.1.0
- Website: https://imcoder.in/
- Author: imcoderofficial <support@imcoder.in>

OneAI provides a lightweight starting point for desktop tooling using Electron. It's configured to build Windows installers using `electron-builder` and ships with a small set of assets (icons and branding).

## Why OneAI (benefits)

- Fast, minimal Electron scaffold for building desktop apps.
- Windows-ready packaging with NSIS via `electron-builder`.
- Easy to extend: UI assets live in `assets/`, app entry is `main.js`.

## Features

- Cross-platform Electron foundation (packaging configured for Windows).
- Packaged installer artifact name: `OneAI Setup ${version}.exe`

## Install & Quick start (developer)

Prerequisites:

- Node.js (LTS recommended)
- npm (or yarn)

Clone the repo, install dependencies, then run the app in development:

```powershell
git clone <repo-url>
cd OneAI
npm install
npm run start
```

This launches the Electron window using the local `main.js` and `renderer.js` files.

## Build a Windows installer

The project uses `electron-builder` to create Windows installers using NSIS. To build a distributable for Windows:

```powershell
npm run dist
```

The built installers are placed in the `dist/` folder (as configured in `package.json`).

## Project structure

- `main.js` — Electron main process entry point
- `renderer.js` — Renderer process (UI) script
- `preload.js` — Preload script for secure IPC
- `index.html` — App UI
- `assets/` — Icons and branding (`logo.ico`, `logo.png`, `logo.svg`)
- `package.json` — App metadata and build configuration

## Contributing

Contributions are welcome. Suggested workflow:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Open a pull request describing the change.

If you plan to publish a packaged installer, update `build` settings in `package.json` and include any required code signing or publisher details.

## Troubleshooting

- If `npm run start` fails, ensure your Node version is compatible with the Electron version specified in `devDependencies`.
- If packaging fails, inspect the `electron-builder` output in the terminal and confirm the `assets` folder contains the icon files referenced in `package.json`.


- Create a basic `LICENSE` (MIT) file for the repo.
- Add GitHub Action workflow for building releases using `electron-builder`.
