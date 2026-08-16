# VaultKey Browser

VaultKey Browser is a standalone, local-first password manager extension built with React, TypeScript, Vite, Manifest V3, and native Web Crypto. It has no backend, cloud account, analytics, telemetry, or runtime network dependency.

## Phase 05

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

Current URLs and hostnames are not saved as browsing history, logged, or transmitted. VaultKey does not yet inspect forms, inject credentials, fill webpages, or submit logins. Those capabilities belong to a later phase.

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

Session storage may contain:

- `vaultkey.session` active Vault Key session
- `vaultkey.generatorSettings` non-secret generator preferences
- A short-lived `vaultkey.pendingCredentialPrefill` current-URL handoff, removed immediately when the Add Credential form opens

Local and session storage access is restricted to trusted extension contexts where supported. The manifest requests only `storage` and `activeTab`. `activeTab` is used when VaultKey is invoked to read the active HTTP/HTTPS tab URL. There are no content scripts, `tabs` permission, scripting permission, host permissions, remote images, favicon APIs, autofill, or `chrome.storage.sync` usage.

## Commands

```bash
npm install
npm run test
npm run typecheck
npm run build
```

On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`. The production extension is emitted to `dist/`; load that directory from `chrome://extensions` using **Load unpacked**.

## Current limitations

Phase 05 intentionally does not include content scripts, DOM/form detection, credential injection, autofill, automatic submit, clipboard auto-clear, inactivity auto-lock, master-password changes, recovery, sync, backup, or encrypted import/export. These belong to later phases.
