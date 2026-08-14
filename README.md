# VaultKey Browser

VaultKey Browser is a standalone, local-first password manager browser extension. It is independent of the VaultKey desktop application and does not require a desktop executable, Python, a native host, a local service, a database, or a backend.

## Phase 01

This repository currently contains the application foundation and polished UI shell:

- Manifest V3 Chrome/Chromium extension
- Compact locked and unlocked popup states
- Mock current-site and matching-login presentation
- Full-page vault with Dashboard, Vault, Generator, Security, and Settings views
- Responsive shared design system and reusable React components
- Minimal background service-worker bootstrap
- Locally generated extension icon assets

**Phase 01 uses mock data only. No real password storage or encryption is implemented yet.** The mock master-password value is held only in component state, is never logged or persisted, and is cleared immediately when the mock vault is unlocked.

## Technology

- React 19
- TypeScript (strict mode)
- Vite
- Modern CSS with centralized design tokens
- Chrome Extension Manifest V3

The extension has no runtime network dependency, remote code, analytics, telemetry, backend, or requested browser permissions.

## Development

Requirements: Node.js 20.19+ (or 22.12+) and npm.

```bash
npm install
npm run dev
```

Vite opens the popup entry during development. The browser extension itself must be loaded from a production build; it does not require a dev server once built.

Useful commands:

```bash
npm run typecheck
npm run generate:icons
npm run build
```

`npm run build` type-checks the project, regenerates the local PNG icons, and creates the installable extension in `dist/`.

## Load unpacked in Chrome or Edge

1. Run `npm install`.
2. Run `npm run build`.
3. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
4. Enable **Developer mode**.
5. Select **Load unpacked**.
6. Choose this project's `dist/` directory.
7. Pin **VaultKey Browser** and select its toolbar icon to open the popup.

Enter any non-empty demo value and choose **Unlock Vault**. The value is not verified, stored, or logged. Use **Open full vault** to open `vault.html` in a new extension tab.

## Build output

```text
dist/
├── manifest.json
├── popup.html
├── vault.html
├── assets/
├── background/
│   └── serviceWorker.js
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Current limitations

Phase 01 intentionally does not include real master-password verification, encryption, key derivation, credential persistence or CRUD, password generation, current-tab detection, content scripts, autofill, clipboard handling, auto-lock timers, or encrypted import/export. Controls representing these features are disabled or clearly marked as demonstrations. These capabilities belong to later phases.
