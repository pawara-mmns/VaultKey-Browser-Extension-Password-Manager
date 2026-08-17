# VaultKey Browser

VaultKey Browser is a standalone, local-first password manager extension built with React, TypeScript, Vite, Manifest V3, and native Web Crypto. It has no backend, cloud account, analytics, telemetry, or runtime network dependency.

## Phase 07

Phase 07 adds a local security-management layer:

- Persistent, validated non-secret settings under `vaultkey.settings`
- VaultKey-activity-based Auto Lock using session timestamps and reconstructible `chrome.alarms`
- One central cleanup path for manual lock, inactivity, master-password change, restore, and reset
- Optional clipboard read/write permission requested only from an explicit **Enable Protection** action
- Password clipboard protection using a SHA-256 digest and expiry in trusted session storage—never plaintext
- Minimal offscreen clipboard document that clears only when the clipboard still matches VaultKey's digest
- Change Master Password by re-wrapping the same random Vault Key with a fresh KDF salt and AES-GCM IV
- Authenticated, metadata-hiding `.vkbak` backups encrypted with a backup-specific PBKDF2 salt and AES-GCM container
- Restore validation and in-memory rollback snapshot before any current-vault replacement
- Strong `RESET` confirmation that removes only VaultKey-owned local data

Auto Lock tracks activity inside VaultKey only. It does not monitor general browsing or operating-system idle state. Backup, restore, password change, clipboard protection, and reset remain entirely local and offline.

## Phase 06

Phase 06 adds controlled, user-initiated Quick Fill:

- Shows a separate **Fill Login** action for each account matched to the active website
- Re-queries and strictly revalidates the active tab and saved hostname before decrypting the selected credential
- Decrypts only the credential selected by the user
- Injects one self-contained function into the active tab's main frame only after the explicit click
- Checks the page hostname again inside the injected function before touching the form
- Selects only visible, enabled, editable login inputs using conservative signals
- Refuses sign-up, password-change, ambiguous multi-password, unsupported, and domain-changed pages
- Supports password-only partial success when no safe username field can be identified
- Dispatches standard `input` and `change` events for framework compatibility
- Never clicks buttons, submits forms, or presses Enter; the user reviews and signs in manually
- Returns only a structured success/failure result to the extension

Quick Fill has no background scanning, static content script, host permission, fill history, secret logging, or network request. Plaintext credentials exist only for the selected operation and are not written to extension or page storage.

**VaultKey never automatically submits login forms.**

## Phase 05 site awareness

Phase 05 adds current-website awareness without accessing page content:

- Reads the active tab URL only when the user invokes VaultKey
- Normalizes HTTP/HTTPS hostnames, ports, trailing dots, and the common `www.` prefix
- Matches saved credential hostname metadata with strict boundary-aware rules
- Suggests exact matches before safe directional subdomain matches
- Requires exact matching for IP addresses and localhost
- Rejects lookalikes and suffix attacks such as `fakepaypal.com` and `paypal.com.evil.test`
- Shows all matching accounts before generic popup search
- Supports explicit Copy Username, Copy Password, and Open actions
- Prefills Add Login with the current URL through a one-time session handoff that is immediately removed
- Derives missing hostname metadata from older credentials' saved website at runtime

Current URLs and hostnames are not saved as browsing history, logged, or transmitted.

## Encrypted credential vault

Phase 04 turns the existing authenticated vault into an encrypted credential manager:

- Add, view, edit, favorite, search, and delete credentials
- AES-GCM encryption with the existing random 256-bit Vault Key
- Fresh random 96-bit IV for every credential create or edit
- Versioned, purpose-bound AAD: `VaultKeyBrowser:Credential:v1:<id>:username` and `...:<id>:secret`
- Encrypted username/email, password, and notes
- Plaintext local metadata for service name, website, normalized hostname, favorite state, and timestamps
- Versioned, validated records under `vaultkey.credentials` in `chrome.storage.local`
- Metadata and locally decrypted username search without a plaintext username index
- On-demand detail decryption, password reveal, and explicit username/password copy
- Generator **Save to vault** flow that transfers the current generated password in React memory only
- Live Dashboard counts, recent credentials, Favorites, full Vault list, and compact popup access
- Cross-context refresh through `chrome.storage.onChanged`
- Isolated handling for malformed or AES-GCM-authentication-failing records

The Phase 02 authentication architecture and Phase 03 password generator remain active.

## Security architecture

```text
Master password
    └─ PBKDF2-HMAC-SHA-256 + random salt (600,000 iterations)
         └─ AES-GCM Key Encryption Key
              └─ unwraps random 256-bit Vault Key
                   └─ AES-GCM encrypts credential secret + fresh 96-bit IV + credential AAD
```

The master password and Key Encryption Key are never stored. The raw Vault Key is never persistent; its Base64 session representation exists only under `vaultkey.session` in trusted-context `chrome.storage.session` while unlocked and is removed on manual lock.

Each stored credential has this shape:

```text
id
version
metadata.serviceName          plaintext local metadata
metadata.website             plaintext local metadata
metadata.hostname            plaintext local metadata for future domain matching
metadata.favorite            plaintext, so toggling does not re-encrypt secrets
metadata.createdAt/updatedAt plaintext timestamps
encrypted.username.algorithm   AES-GCM
encrypted.username.iv          Base64, fresh for each username encryption
encrypted.username.ciphertext  authenticated username ciphertext
encrypted.secret.algorithm     AES-GCM
encrypted.secret.iv            Base64, fresh for each password/notes encryption
encrypted.secret.ciphertext    authenticated password/notes ciphertext
```

Username is encrypted separately from the password/notes secret payload. This lets lists and search decrypt only username summaries without decrypting passwords in advance. Those values are never duplicated into plaintext metadata. Credential details, edit, and copy decrypt only the selected record.

Malformed records are skipped without crashing the rest of the vault. A record that fails AES-GCM authentication remains stored and is shown as unreadable; VaultKey does not silently delete it.

## Password generator

The generator uses `crypto.getRandomValues`, rejection sampling, and a secure Fisher–Yates shuffle. It supports lengths from 8–64, category guarantees, ambiguous-character exclusion, entropy estimates, and five strength levels.

Generated passwords remain in React/runtime memory only. Generator preferences are stored separately under `vaultkey.generatorSettings` in `chrome.storage.session`. **Save to vault** pre-fills the Add Credential form without writing the generated value to storage; encryption occurs only when the user saves.

## Storage and permissions

Persistent local storage contains only:

- `vaultkey.vaultConfig`
- `vaultkey.credentials` encrypted collection
- `vaultkey.settings` validated non-sensitive security settings

Session storage may contain:

- `vaultkey.session` active Vault Key session
- `vaultkey.session.lastActivityAt` inside the active session
- `vaultkey.generatorSettings` non-secret generator preferences
- `vaultkey.clipboardProtection` SHA-256 digest and expiry only
- A short-lived `vaultkey.pendingCredentialPrefill` current-URL handoff, removed immediately when the Add Credential form opens

Local and session storage access is restricted to trusted extension contexts where supported. Required permissions are `storage`, `activeTab`, `scripting`, `alarms`, and `offscreen`; `clipboardRead` and `clipboardWrite` are optional. `activeTab` and `scripting` remain limited to explicit Quick Fill, alarms use stored timestamps as their source of truth, and the offscreen document contains only digest-based clipboard comparison/clearing logic. There are no static content scripts, `tabs`, `downloads`, `idle`, history, cookies, host permissions, `<all_urls>`, remote APIs, background autofill, automatic submit, cloud sync, analytics, or telemetry.

## Commands

```bash
npm install
npm run test
npm run typecheck
npm run build
```

On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`. The production extension is emitted to `dist/`; load that directory from `chrome://extensions` using **Load unpacked**.

## Current limitations

Phase 07 intentionally does not include static content scripts, background page scanning, automatic or page-load fill, automatic submit, iframe fill, password recovery, cloud sync, remote backup, automatic credential capture, or breach APIs. These belong to later phases.
