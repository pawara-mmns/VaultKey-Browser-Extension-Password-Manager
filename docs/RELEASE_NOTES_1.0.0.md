# VaultKey Browser 1.0.0

VaultKey Browser 1.0.0 is the first public-release candidate of the standalone, local-first password manager extension.

## Highlights

- Create and unlock an encrypted vault stored in the current browser profile.
- Generate cryptographically secure passwords with configurable options.
- Add, search, favorite, view, edit, copy, and delete encrypted credentials.
- See strict current-site matches and explicitly fill one selected login.
- Use activity-based Auto Lock and optional clear-if-unchanged clipboard protection.
- Change the master password by securely re-wrapping the Vault Key.
- Export and restore password-protected, metadata-hiding `.vkbak` files.

Quick Fill never submits a login form. VaultKey has no backend, cloud account, analytics, telemetry, host permissions, static content scripts, or automatic page scanning.

## Upgrade and backup guidance

Version 1.0.0 preserves the existing versioned vault and credential formats used by the pre-release builds. Create a fresh encrypted backup and confirm its password before upgrading, uninstalling, resetting the browser profile, or moving data.

## Known limitations

VaultKey does not include password recovery, cloud sync, remote backup, breach monitoring, automatic credential capture, background autofill, iframe filling, or automatic form submission. Auto Lock measures VaultKey activity rather than operating-system idle time.

The Chrome Web Store publisher must still provide a public privacy-policy URL, support/project URLs, final screenshots and promotional artwork, complete clean-profile manual QA, and submit the final ZIP through the Developer Dashboard.
