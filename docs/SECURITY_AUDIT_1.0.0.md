# VaultKey Browser 1.0.0 Release Audit

Audit date: 2026-08-17

This report records the release-preparation review of the repository and final build. Automated results and package contents must be updated if code or dependencies change after this audit.

## Architecture and storage review

- Master passwords and derived Key Encryption Keys are not persisted.
- A random 256-bit Vault Key is AES-GCM wrapped and stored only in wrapped form at rest.
- The unlocked Vault Key is stored in trusted `chrome.storage.session` and removed through the central lock cleanup path.
- Credential usernames and password/notes payloads use separate AES-GCM encryptions, fresh 96-bit IVs, and versioned purpose-bound AAD.
- Persistent plaintext is limited to vault configuration, credential organizational/site metadata, and validated non-secret settings.
- Generator values remain runtime-only until the user saves an encrypted credential.
- Clipboard protection stores a SHA-256 digest and expiry, never clipboard plaintext or history.
- Backup encryption uses a backup-specific salt and authenticated container; restore validates/decrypts before replacement and keeps an in-memory rollback snapshot.

## Quick Fill review

- No static content script or host permission is declared.
- The active tab and stored hostname are revalidated before decrypting the selected item.
- Injection is main-frame-only and user initiated.
- The injected function refuses sign-up/password-change indicators and ambiguous password fields.
- It dispatches input/change events but contains no submit, requestSubmit, button click, Enter key, or persistent page-storage behavior.

## Permission review

Required permissions are `storage`, `activeTab`, `scripting`, `alarms`, and `offscreen`. Optional permissions are `clipboardRead` and `clipboardWrite`. No host permissions, `<all_urls>`, `tabs`, cookies, history, downloads, `idle`, or browser sync are present. Detailed justifications are in `docs/PERMISSIONS.md`.

## Network, logging, and secret review

Runtime source contains no `fetch`, XMLHttpRequest, WebSocket, analytics/telemetry client, remote URL dependency, or console logging. URL parsing defaults user-entered hostnames to an HTTPS scheme locally and does not perform a network request. Environment-file and release-bundle scans are part of the release checklist.

## Dependencies and licenses

The production dependency tree contains React 19.2.8, ReactDOM 19.2.8, and transitive Scheduler 0.27.0. Installed package metadata and license files identify all three as MIT-licensed by Meta Platforms, Inc. and affiliates. Their notice is preserved in `THIRD_PARTY_NOTICES.md` and copied into the release bundle. VaultKey Browser itself is Apache-2.0 licensed; the unmodified official license text is in `LICENSE`. No project `NOTICE` file is required by a third-party production dependency reviewed here.

Development dependencies are not shipped as files in the extension ZIP; their lockfile license identifiers remain available for source-build review.

Registry audit reported 0 vulnerabilities across all severities. The outdated review found no pending production dependency update under the declared ranges. Available newer majors affect development tooling (`@types/chrome`, `@types/node`, Vite/plugin, TypeScript, and Vitest) and were intentionally not introduced during release stabilization.

## Production hardening

- Production source maps are explicitly disabled.
- Popup and full-vault roots have a generic React error boundary that does not expose raw errors or stack traces.
- Security dialogs use labelled descriptions, initial focus, focus containment, Escape/cancel behavior, and focus restoration.
- Production UI contains no phase, demo, roadmap, or “coming later” labels.
- Icons are deterministic local PNGs with no remote dependency.

## Validation status

- Vitest: 17 files and 107 tests passed.
- TypeScript: typecheck passed.
- Production build: passed; 20 files, 363,745 bytes unpacked.
- Bundle scan: no source maps, test/source/environment/log files, known secret patterns, fake screenshot identities, application-owned console calls, network API calls, or production roadmap wording.
- Release archive: 118,168 bytes; SHA-256 `6346A10C198898B7E302B548045FD216C41BA80B68C9F7DA498BAF6196158FD6`.

The archive contains `manifest.json` at its root. Clean-profile Chrome loading and full manual scenarios remain a human release gate if browser automation is unavailable; status is recorded in `RELEASE_CHECKLIST.md`.
