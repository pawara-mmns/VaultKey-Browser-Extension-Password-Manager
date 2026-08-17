# VaultKey Browser Privacy Policy

Last updated: August 17, 2026

VaultKey Browser is a local-first password manager. This policy describes the data handled by version 1.0.0 of the extension.

## Data VaultKey handles

VaultKey handles information the user chooses to save, including service names, website addresses, normalized hostnames, usernames or email addresses, passwords, notes, favorites, and creation/update timestamps. It also handles non-secret security preferences, temporary unlocked-session state, and the active tab URL when the user opens VaultKey or requests Quick Fill.

Username/email, password, and notes fields are encrypted before persistent storage. Service name, website, normalized hostname, favorite state, and timestamps remain plaintext in local extension storage so the vault can organize entries and match websites. A password-protected backup encrypts the entire persistent payload, including that metadata.

## How data is used

The extension uses saved data only to provide the user-facing password-management functions described in its interface: storing and organizing credentials, generating passwords, suggesting credentials for the current site, explicitly filling a selected login, locking the vault, protecting copied passwords, and creating or restoring local backups.

Quick Fill sends the selected username and password to matching login fields in the active page only after the user chooses **Fill Login**. VaultKey does not automatically submit the form.

## Storage and retention

Persistent vault data is stored in `chrome.storage.local` in the current browser profile. Unlocked Vault Key material, generator preferences, activity timestamps, optional clipboard digests, and short-lived form prefill values use trusted `chrome.storage.session`. Plaintext copied passwords use the operating system clipboard only because the user requested a copy operation; VaultKey does not keep clipboard history.

Data remains until the user deletes an item, resets VaultKey, clears the extension's storage, removes the browser profile, or uninstalls the extension. Browser behavior may remove extension storage on uninstall. Encrypted backup files created by the user are outside extension storage and remain until the user deletes them.

## Collection, transmission, and sharing

VaultKey has no developer-operated server, account system, cloud sync, analytics, telemetry, advertising, or runtime network request. It does not transmit vault data, browsing activity, or usage data to the developer or any third party. It does not sell user data and does not use user data for advertising, credit, lending, or unrelated purposes.

## Browser access

VaultKey reads the active tab URL only when the user invokes the extension or starts an explicit Quick Fill action. It does not maintain browsing history. It has no persistent host permissions and no static content script. The Quick Fill function accesses only the active page's main-frame login fields for that one user-initiated operation.

Optional clipboard read/write access is requested only after the user enables clipboard protection. VaultKey stores only a SHA-256 digest and expiry for the copied password, then clears the clipboard only if its current content still matches that digest.

## Security

VaultKey uses Web Crypto PBKDF2-HMAC-SHA-256 and AES-GCM to protect stored secrets. No security system can eliminate every risk. Users should choose a strong, unique master password, keep secure backups, lock the vault when not in use, and protect their browser profile and operating system.

## User choices and deletion

Users can view, edit, and delete credentials in the vault; enable or disable optional clipboard protection; change Auto Lock settings; export or restore encrypted backups; and reset all VaultKey-owned local data. Reset and uninstall are not password-recovery mechanisms and may cause permanent data loss without a usable backup.

## Contact and policy URL

Security issues must be reported privately using the process in `SECURITY.md`. Before Chrome Web Store submission, the publisher must host this policy at a stable, publicly accessible HTTPS URL and enter that URL in the Developer Dashboard. No public policy URL is claimed by this repository.

Material privacy changes should be documented in the changelog and reflected in an updated policy date.
