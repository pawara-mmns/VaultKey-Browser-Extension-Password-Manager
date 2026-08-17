# VaultKey Browser

VaultKey Browser is a standalone, local-first password manager extension for Chromium browsers. It creates an encrypted vault in the current browser profile, generates strong passwords, organizes credentials, and fills a selected login only after an explicit user action. It has no account system, backend, cloud sync, analytics, telemetry, advertising, or runtime network dependency.

## Features

- Encrypted credential storage for usernames, passwords, and notes
- Secure password generation with configurable length and character groups
- Search, favorites, recent items, editing, deletion, and per-item reveal/copy actions
- Current-site suggestions using strict, boundary-aware hostname matching
- Explicit Quick Fill with no background scanning or automatic submission
- Activity-based Auto Lock inside VaultKey
- Optional clear-if-unchanged clipboard protection
- Master-password changes without decrypting and re-encrypting every credential
- Password-protected, metadata-hiding local `.vkbak` backups
- Local reset with a strong confirmation step

## Security architecture

```text
Master password
    └─ PBKDF2-HMAC-SHA-256 + random salt (600,000 iterations)
         └─ AES-GCM Key Encryption Key
              └─ unwraps a random 256-bit Vault Key
                   └─ AES-GCM encrypts credential data with fresh IVs and purpose-bound AAD
```

The master password and derived Key Encryption Key are never stored. The random Vault Key is wrapped at rest and exists in trusted extension session storage only while the vault is unlocked. Each credential uses fresh 96-bit AES-GCM IVs. Username data is encrypted separately from password and notes so list views do not need to decrypt passwords.

Persistent local metadata includes service name, website, normalized hostname, favorite state, and timestamps. This supports local organization and site matching without decrypting all secret fields. There is no password recovery mechanism; losing the master password and all usable backups means losing access to the encrypted vault.

## Local-first privacy

Vault data stays in `chrome.storage.local` in the current browser profile. Unlocked session material stays in trusted `chrome.storage.session`. VaultKey does not send credentials, browsing activity, or usage data to a developer or third party. It does not use remote APIs or load remote code.

Uninstalling the extension or clearing its extension storage may permanently remove the local vault. Create and verify an encrypted backup before uninstalling, resetting the browser profile, or moving to another device.

See [PRIVACY.md](PRIVACY.md) for the complete data-handling statement.

## Quick Fill

Quick Fill runs only after the user opens VaultKey and chooses **Fill Login** for a credential matched to the active HTTP or HTTPS hostname. VaultKey then revalidates the active tab and saved hostname, decrypts only the selected credential, and injects one self-contained function into the main frame.

The injected function conservatively selects visible, editable login fields. It refuses sign-up, password-change, ambiguous multi-password, unsupported, and hostname-changed pages. It never clicks a button, submits a form, presses Enter, scans pages in the background, or persists fill history. The user reviews the result and signs in manually.

## Installation

Chrome Web Store publication is prepared but requires publisher-controlled listing and privacy-policy URLs. For local installation, build and load the unpacked extension as described below.

## Development

Requirements: a current Node.js version supported by Vite 7 and npm.

```bash
npm install
npm run test
npm run typecheck
npm run build
```

On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`.

## Build and load unpacked

1. Run `npm run build`.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the generated `dist/` directory.

The production build disables source maps and contains only runtime extension assets plus required license notices.

## Permissions

Required permissions are deliberately limited:

- `storage` — stores the encrypted vault, non-secret metadata/settings, and unlocked session state locally.
- `activeTab` — reads the current tab URL only when the user invokes VaultKey and grants temporary access for explicit Quick Fill.
- `scripting` — injects the one-time Quick Fill function after the user selects an account.
- `alarms` — schedules Auto Lock and optional clipboard expiry work.
- `offscreen` — provides the minimal extension document needed to compare and clear an unchanged clipboard value.

Optional `clipboardRead` and `clipboardWrite` permissions are requested only when the user explicitly enables clipboard protection. VaultKey has no host permissions, static content scripts, `tabs`, history, cookies, downloads, or `<all_urls>` access.

See [docs/PERMISSIONS.md](docs/PERMISSIONS.md) for the detailed permission rationale.

## Backup and restore

**Create Encrypted Backup** exports the full persistent vault as a password-protected `.vkbak` file. The backup uses a backup-specific PBKDF2 salt and authenticated AES-GCM encryption, hiding credential metadata as well as secret fields.

Restore parses, validates, and decrypts the complete backup before replacing current local data. VaultKey keeps an in-memory rollback snapshot during replacement. Backups remain the user's responsibility: store them securely, keep more than one known-good copy, and verify the password before relying on a backup.

## Security limitations

- Security depends on the strength and secrecy of the master password and backup passwords.
- An unlocked browser profile, compromised operating system, malicious browser, or privileged extension may observe data while it is being used.
- Quick Fill operates on page fields selected with conservative heuristics; users must verify the destination and form before signing in.
- Auto Lock measures activity inside VaultKey, not operating-system idle time or general browsing activity.
- Clipboard protection is optional and cannot prevent another application from reading the clipboard before expiry.
- Website and service metadata remain plaintext in local extension storage to support organization and matching; usernames, passwords, and notes are encrypted.
- VaultKey does not provide breach monitoring, password recovery, cloud backup, automatic credential capture, iframe filling, or automatic form submission.

Please report suspected vulnerabilities privately according to [SECURITY.md](SECURITY.md).

## Project structure

```text
src/auth/          vault creation, unlock, and lock-gate UI
src/background/    Manifest V3 service worker
src/content/       isolated, user-triggered Quick Fill function
src/credentials/   credential management UI
src/generator/     password-generator state and controls
src/pages/         full-vault application pages
src/popup/         extension popup application
src/security/      cryptography, KDF, session, and generator primitives
src/services/      vault, credential, fill, settings, backup, and lock workflows
src/storage/       local/session storage boundaries and validation
src/vault/         full-vault application shell
docs/              store, permissions, release, and audit documentation
scripts/           deterministic icon generation
```

## License

VaultKey Browser is licensed under the Apache License 2.0.
Copyright 2026 Pawara Samarawickrama.
See the `LICENSE` file for details.

React, ReactDOM, and Scheduler are included under the MIT License; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Disclaimer

VaultKey Browser is provided on an “AS IS” basis, without warranties or conditions of any kind. Review the source and assess whether it meets your security, legal, compliance, and backup requirements before relying on it for sensitive credentials.
