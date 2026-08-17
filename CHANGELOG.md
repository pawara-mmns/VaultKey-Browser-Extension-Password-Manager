# Changelog

All notable changes to VaultKey Browser are documented here.

## [1.0.0] - 2026-08-17

### Added

- Local encrypted vault creation, unlock, lock, and reset workflows
- AES-GCM credential encryption with fresh IVs and purpose-bound authenticated data
- Secure password generator with category guarantees and unbiased random selection
- Credential search, favorites, recent items, details, edit, delete, copy, and reveal actions
- Strict current-site matching and explicit, non-submitting Quick Fill
- Activity-based Auto Lock and optional clear-if-unchanged clipboard protection
- Master-password re-wrapping and encrypted `.vkbak` backup/restore
- Production error fallback, release documentation, permission disclosures, privacy policy, and license notices

### Security

- No backend, cloud sync, analytics, telemetry, remote code, static content scripts, host permissions, or automatic form submission
- Source maps disabled in production release builds
