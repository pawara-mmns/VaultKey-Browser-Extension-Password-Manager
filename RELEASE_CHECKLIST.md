# VaultKey Browser 1.0.0 Release Checklist

Release date target: 2026-08-17

## Code

- [x] Manifest and package versions are `1.0.0`.
- [x] Product name and descriptions consistently use **VaultKey Browser**.
- [x] Production UI contains no phase, demo, tutorial-roadmap, or “coming later” wording.
- [x] Popup and full-vault roots have a safe top-level error boundary.
- [x] Security dialogs support labelled focus, Escape/cancel, focus containment, and restoration.
- [x] Review the final diff after all release work is complete.

## Security

- [x] Master password and derived Key Encryption Key are not persisted.
- [x] Credential secrets use AES-GCM with fresh IVs and purpose-bound AAD.
- [x] Quick Fill is explicit, hostname-revalidated, main-frame-only, and never submits.
- [x] Clipboard protection stores only digest/expiry and clears only unchanged content.
- [x] Backup restore validates/decrypts before replacement and has rollback handling.
- [x] Runtime source has no network, analytics, telemetry, remote-code, or console-log path.
- [ ] Complete clean-profile manual security regression in Chrome.

## Permissions

- [x] Required permissions are limited to `storage`, `activeTab`, `scripting`, `alarms`, and `offscreen`.
- [x] Clipboard read/write permissions remain optional and explicitly requested.
- [x] No host permissions, static content scripts, `<all_urls>`, `tabs`, cookies, history, downloads, or `idle` permission.
- [x] Every permission is justified in `docs/PERMISSIONS.md` and the Store privacy draft.

## Privacy

- [x] `PRIVACY.md` accurately describes local storage, encrypted/plaintext fields, active-tab access, Quick Fill, clipboard, retention, deletion, and no transmission/sale/ads.
- [x] Chrome Web Store data categories and limited-use statements are drafted.
- [ ] Publisher hosts `PRIVACY.md` at a stable public HTTPS URL.
- [ ] Publisher enters and verifies the public privacy URL in the Developer Dashboard.

## License

- [x] Root `LICENSE` contains the unmodified official Apache License 2.0 text.
- [x] Copyright is documented as 2026 Pawara Samarawickrama.
- [x] `package.json` declares `Apache-2.0`.
- [x] React, ReactDOM, and Scheduler MIT notices are preserved in `THIRD_PARTY_NOTICES.md` and the release bundle.

## Dependencies and tests

- [x] `npm audit` completes with no unresolved release-blocking vulnerability (0 total vulnerabilities).
- [x] `npm outdated` is reviewed without forced or unnecessary upgrades; only major development-tool updates are available.
- [x] All 17 Vitest test files and 107 tests pass.
- [x] TypeScript typecheck passes.

## Build

- [x] Production source maps are explicitly disabled.
- [x] Clean `npm run build` succeeds.
- [x] `dist/` contains only 20 runtime assets and legal notices (363,745 bytes unpacked).
- [x] Final build scan finds no source maps, tests, environment files, secrets, application logs, mock credentials, production roadmap wording, or network API calls.
- [x] Release ZIP has `manifest.json` at archive root.
- [ ] Load the exact packaged build in Chrome and confirm the manifest is accepted without errors.
- [x] Release ZIP SHA-256: `6346A10C198898B7E302B548045FD216C41BA80B68C9F7DA498BAF6196158FD6`.

## Chrome Web Store

- [x] Listing name, short description, detailed description, and single-purpose statement are drafted.
- [x] Permission justifications and privacy disclosures are drafted.
- [x] Asset plan uses fake data and current required dimensions.
- [ ] Capture up to five clean 1280×800 screenshots.
- [ ] Create the required 440×280 promotional image.
- [ ] Provide owner-controlled homepage and support URLs.
- [ ] Complete Developer Dashboard privacy certifications against the final ZIP.

## Manual QA

Automation attempt on 2026-08-17 was blocked before Chrome control: Google Chrome is installed, but the ChatGPT browser extension is not installed/enabled in the selected profile and the Browser plugin native-host manifest/registry entry is missing. Reinstall the Browser plugin from the ChatGPT plugin UI (or install it from **Settings → Computer use**), then complete every item below in a clean Chrome profile. No substitute browser was used.

- [ ] Fresh install and first-run vault creation.
- [ ] Lock/unlock and wrong-password handling.
- [ ] Add, edit, favorite, search, reveal, copy, and delete credential.
- [ ] Password generator option and save-to-vault flows.
- [ ] Exact/subdomain match, lookalike rejection, and Quick Fill success/refusal cases.
- [ ] Verify Quick Fill never submits and never fills after hostname changes.
- [ ] Auto Lock across popup/full-vault close, reopen, alarm, and expired timestamp cases.
- [ ] Clipboard permission denial, enable/disable, unchanged clear, and changed-content preservation.
- [ ] Change master password and verify old password rejection/new password success.
- [ ] Backup, wrong-password restore, damaged backup, successful restore, and rollback failure path.
- [ ] Reset cancellation, confirmation, and post-reset first-run state.
- [ ] Upgrade from the latest pre-release vault without data loss.
- [ ] Uninstall/reinstall data-loss behavior is understood and documented.
- [ ] Inspect popup/full-vault console and service worker for errors.

## Release

- [x] Final diff reviewed and release notes match behavior.
- [x] Final ZIP and hash recorded.
- [ ] Publisher signs off on privacy, security contact, assets, support, and store fields.
- [ ] Upload the exact verified ZIP to Chrome Web Store.
- [ ] Preserve a secure copy of the source commit, lockfile, ZIP, hash, and listing text.
