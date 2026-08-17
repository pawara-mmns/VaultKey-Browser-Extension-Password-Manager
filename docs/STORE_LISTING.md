# Chrome Web Store Listing Draft

## Name

VaultKey Browser

## Short description

Store, generate, manage, and explicitly fill encrypted credentials locally in your browser.

## Detailed description

VaultKey Browser is a local-first password manager for people who want their vault to stay in their browser profile.

Create an encrypted vault, generate strong passwords, organize credentials, search and favorite entries, and create password-protected local backups. When you open VaultKey on a website, strict hostname matching can suggest saved accounts for that site.

Quick Fill is always deliberate: choose the account and select **Fill Login**. VaultKey rechecks the website, decrypts only that credential, and fills conservative login fields in the main page. It never submits the form, clicks a sign-in button, scans pages in the background, or fills on page load.

Privacy and control:

- No account or cloud sync
- No analytics, telemetry, ads, or developer-operated server
- No host permissions or persistent access to every website
- No static content scripts
- Optional clipboard protection requested only when enabled
- Encrypted local `.vkbak` export and restore
- Activity-based Auto Lock inside the extension

Saved usernames, passwords, and notes are encrypted with authenticated AES-GCM. Service name, website/hostname, favorite state, and timestamps remain local metadata so VaultKey can organize entries and match the current site. Protect your master password and keep tested backups: VaultKey cannot recover a forgotten master password.

VaultKey Browser is open-source software licensed under Apache License 2.0.

## Category suggestion

Productivity

The publisher should confirm the available category choices in the current Developer Dashboard.

## Support and policy fields

- Privacy policy URL: **publisher must provide a stable public HTTPS URL for `PRIVACY.md`**
- Support URL: **publisher must provide an owner-controlled repository or support page**
- Homepage URL: **publisher must provide the canonical project page**

Do not invent or submit placeholder domains.
