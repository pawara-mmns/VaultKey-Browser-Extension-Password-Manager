# Contributing

Thank you for improving VaultKey Browser. Keep changes local-first, narrowly permissioned, and reviewable.

## Setup

```bash
npm install
npm run test
npm run typecheck
npm run build
```

## Pull requests

- Explain the user-visible behavior and security/privacy impact.
- Add or update tests for logic changes.
- Do not add host permissions, remote code, analytics, telemetry, network services, or secret logging without an explicit architectural and privacy review.
- Preserve encrypted storage compatibility or document and test a migration.
- Use fake accounts and domains in tests, screenshots, fixtures, and examples.
- Update `CHANGELOG.md`, permissions, privacy, and store documentation when behavior changes.

Run the full test, typecheck, and production build before requesting review. Do not commit `node_modules/`, `dist/`, environment files, logs, coverage, or release ZIPs.

## Security reports

Do not disclose suspected vulnerabilities in a public issue or pull request. Follow [SECURITY.md](SECURITY.md).

## License

Unless explicitly stated otherwise, submitted contributions are licensed under the Apache License 2.0 in accordance with the project's `LICENSE` file.
