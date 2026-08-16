import { describe, expect, it } from "vitest";
import type { CredentialSecret } from "../types/credential";
import { generateVaultKey } from "./crypto";
import { base64ToBytes, bytesToBase64 } from "./encoding";
import { decryptCredentialSecret, decryptCredentialUsername, encryptCredentialSecret } from "./credentialCrypto";

const secret: CredentialSecret = {
  username: "encrypted-user@example.test",
  password: "test-only-secret-value",
  notes: "test-only private notes",
};

describe("credential encryption", () => {
  it("round-trips a credential secret without exposing its values", async () => {
    const key = generateVaultKey();
    const encrypted = await encryptCredentialSecret(secret, "credential-a", key);
    expect(await decryptCredentialSecret(encrypted, "credential-a", key)).toEqual(secret);
    expect(JSON.stringify(encrypted)).not.toContain(secret.username);
    expect(JSON.stringify(encrypted)).not.toContain(secret.password);
    expect(JSON.stringify(encrypted)).not.toContain(secret.notes);
  });

  it("uses a fresh IV and ciphertext for identical inputs", async () => {
    const key = generateVaultKey();
    const first = await encryptCredentialSecret(secret, "credential-a", key);
    const second = await encryptCredentialSecret(secret, "credential-a", key);
    expect(first.username.iv).not.toBe(second.username.iv);
    expect(first.username.ciphertext).not.toBe(second.username.ciphertext);
    expect(first.secret.iv).not.toBe(second.secret.iv);
    expect(first.secret.ciphertext).not.toBe(second.secret.ciphertext);
    expect(await decryptCredentialSecret(first, "credential-a", key)).toEqual(secret);
    expect(await decryptCredentialSecret(second, "credential-a", key)).toEqual(secret);
  });

  it("rejects a wrong vault key, modified ciphertext, and modified AAD identifier", async () => {
    const key = generateVaultKey();
    const encrypted = await encryptCredentialSecret(secret, "credential-a", key);
    await expect(decryptCredentialSecret(encrypted, "credential-a", generateVaultKey())).rejects.toThrow();
    await expect(decryptCredentialSecret(encrypted, "credential-b", key)).rejects.toThrow();

    const bytes = base64ToBytes(encrypted.secret.ciphertext);
    bytes[0] ^= 1;
    await expect(decryptCredentialSecret({ ...encrypted, secret: { ...encrypted.secret, ciphertext: bytesToBase64(bytes) } }, "credential-a", key)).rejects.toThrow();
  });

  it("decrypts username summaries without authenticating or decrypting the password payload", async () => {
    const key = generateVaultKey();
    const encrypted = await encryptCredentialSecret(secret, "credential-a", key);
    const damagedSecretBytes = base64ToBytes(encrypted.secret.ciphertext);
    damagedSecretBytes[0] ^= 1;
    const partiallyDamaged = { ...encrypted, secret: { ...encrypted.secret, ciphertext: bytesToBase64(damagedSecretBytes) } };
    expect(await decryptCredentialUsername(partiallyDamaged, "credential-a", key)).toBe(secret.username);
    await expect(decryptCredentialSecret(partiallyDamaged, "credential-a", key)).rejects.toThrow();
  });
});
