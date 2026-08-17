# Security Policy

## Supported version

Security fixes are applied to the latest released version of VaultKey Browser. Version 1.0.0 is the initial supported release.

## Reporting a vulnerability

Do not open a public issue, discussion, pull request, or social-media post for a suspected vulnerability that could expose credentials or help an attacker.

Use the repository's **Security** tab and **Report a vulnerability** private-reporting form if GitHub Private Vulnerability Reporting is enabled. If that form is unavailable, contact the repository owner through a private, owner-controlled channel listed on the repository profile and ask for a secure reporting route before sending sensitive details. The publisher must add and maintain an explicit private security contact before public release; this document does not invent an email address or endpoint.

Include the affected version, impact, prerequisites, reproducible steps, and a minimal proof of concept. Use fake credentials and remove personal data, real vaults, tokens, and secrets from reports.

## Response expectations

The maintainer should acknowledge a private report, validate its scope, coordinate a fix and release, and agree on disclosure timing with the reporter. No response-time guarantee is made until the publisher documents a maintained security contact and service target.

## Scope notes

Useful reports include cryptographic misuse, secret persistence, permission escalation, hostname-matching bypasses, unsafe form filling, backup/restore integrity failures, or exposure through logs and build artifacts. Reports requiring a fully compromised operating system or browser profile may be out of scope unless VaultKey makes the impact materially worse.
