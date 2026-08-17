# Browser Permission Rationale

VaultKey Browser version 1.0.0 uses the minimum permissions required by its current local-first features. The manifest declares no host permissions and no static content scripts.

## Required permissions

### `storage`

Stores the encrypted vault, plaintext organizational metadata, validated non-secret settings, and trusted unlocked-session state. VaultKey uses `chrome.storage.local` for persistent data and `chrome.storage.session` for temporary runtime/session data. It does not use browser sync storage.

### `activeTab`

Allows VaultKey to read the active tab URL when the user opens the extension and grants temporary page access for an explicit Quick Fill action. Access is user-invoked and does not create persistent site access or browsing history.

### `scripting`

Injects one self-contained Quick Fill function into the active tab's main frame after the user chooses a matching credential. The active hostname is revalidated before decryption and again in the injected function. There is no background injection, page-load scanning, iframe injection, or automatic submit.

### `alarms`

Schedules activity-based Auto Lock and optional clipboard-expiry work. Stored timestamps remain the source of truth, so service-worker suspension or delayed alarms do not extend an expired unlocked session.

### `offscreen`

Creates a minimal local offscreen extension document for clipboard comparison and clearing. Service workers cannot directly access the system clipboard. The offscreen document receives only the expected password digest, reads the current clipboard after the user has enabled optional access, and clears it only if its digest still matches.

## Optional permissions

### `clipboardRead` and `clipboardWrite`

Requested together only after the user explicitly selects **Enable Protection** in Settings. They allow VaultKey to verify and clear a password previously copied through VaultKey. The extension stores only a SHA-256 digest and expiry, never clipboard history or clipboard plaintext. Disabling protection stops the workflow without requiring these permissions for other features.

## Permissions deliberately not requested

VaultKey does not request host permissions, `<all_urls>`, `tabs`, `idle`, cookies, history, downloads, notifications, identity, or browser sync. It does not declare a static content script. Adding a permission requires a user-facing need plus privacy and security review, manifest review, documentation updates, and release testing.
