# Chrome Web Store Asset Plan

Use only fake credentials, reserved example domains, and a clean test browser profile. Never capture personal tabs, bookmarks, profile names, real usernames, passwords, notes, backup filenames, or clipboard content.

## Required assets

### Extension icon

- Source: generated `public/icons/icon128.png`
- Format: PNG, 128×128 pixels
- Artwork: front-facing VaultKey shield/keyhole mark in a 96×96 visual area with transparent padding
- Verify contrast on light and dark backgrounds after the final build

### Small promotional image

- Size: 440×280 pixels
- Concept: centered VaultKey shield/keyhole mark over the established dark purple background treatment
- Keep text minimal or omit it; make the silhouette readable at reduced size
- This asset still needs to be created and approved by the publisher

### Screenshots

Chrome currently accepts 1280×800 or 640×400 full-bleed screenshots and allows up to five. Prefer 1280×800 and verify readability when downscaled.

1. **Encrypted vault dashboard** — populated recent items and security summary using `alice@example.test`, `bob@example.test`, and reserved `.test` websites.
2. **Password generator** — generator controls, entropy/strength feedback, and generated value obscured or clearly fake.
3. **Vault organization** — search, favorites, multiple accounts, and credential details with all secrets masked.
4. **Explicit Quick Fill** — popup on a synthetic `https://login.example.test` page showing matching accounts and separate **Fill Login** actions; do not imply automatic submission.
5. **Security and backup settings** — Auto Lock, optional clipboard protection, change master password, encrypted backup/restore, and reset controls without showing a real file path.

Capture an additional reset or restore-confirmation image for documentation if useful, but the store listing accepts at most five screenshots.

## Optional promotional asset

- Marquee image: 1400×560 pixels
- Use the same icon, colors, and restrained local-first security message
- Required only for certain featuring opportunities, not the base listing

## Capture checklist

- [ ] Use a new test browser profile and fake vault.
- [ ] Use only reserved `.test` or `example.com`-family domains.
- [ ] Hide Chrome profile identity, downloads, paths, bookmarks, notifications, and unrelated tabs.
- [ ] Confirm every visible claim matches version 1.0.0.
- [ ] Confirm no phase, demo, roadmap, or “coming soon” wording is visible.
- [ ] Export exact required dimensions without padding around screenshots.
- [ ] Review at 50% scale and on both light and dark surrounding backgrounds.
- [ ] Keep editable source files outside the extension release ZIP.
