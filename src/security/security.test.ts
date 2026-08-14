import { describe, expect, it } from "vitest";
import { validateCreateVaultInput } from "../auth/validation";
import { generateSecureRandomBytes, generateVaultKey, unwrapVaultKey, wrapVaultKey } from "./crypto";
import { base64ToBytes, bytesToBase64 } from "./encoding";
import { deriveMasterKey } from "./kdf";
import { evaluatePasswordStrength } from "./passwordStrength";

describe("VaultKey security primitives", () => {
  it("generates unique salts and vault keys without exposing their values", () => {
    const firstSalt = generateSecureRandomBytes(16);
    const secondSalt = generateSecureRandomBytes(16);
    const firstVaultKey = generateVaultKey();
    const secondVaultKey = generateVaultKey();

    expect(firstSalt).not.toEqual(secondSalt);
    expect(firstVaultKey).not.toEqual(secondVaultKey);
    expect(firstVaultKey).toHaveLength(32);
  });

  it("round-trips arbitrary binary data through canonical Base64", () => {
    const bytes = new Uint8Array([0, 1, 2, 127, 128, 254, 255]);
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });

  it("wraps the same vault key uniquely and decrypts both results", async () => {
    const salt = generateSecureRandomBytes(16);
    const keyEncryptionKey = await deriveMasterKey("CorrectHorseBatteryStaple!", salt, 10_000);
    const vaultKey = generateVaultKey();

    const firstWrapped = await wrapVaultKey(vaultKey, keyEncryptionKey);
    const secondWrapped = await wrapVaultKey(vaultKey, keyEncryptionKey);

    expect(firstWrapped.iv).not.toBe(secondWrapped.iv);
    expect(firstWrapped.ciphertext).not.toBe(secondWrapped.ciphertext);
    expect(await unwrapVaultKey(firstWrapped, keyEncryptionKey)).toEqual(vaultKey);
    expect(await unwrapVaultKey(secondWrapped, keyEncryptionKey)).toEqual(vaultKey);
  });

  it("rejects a tampered AES-GCM wrapped key", async () => {
    const salt = generateSecureRandomBytes(16);
    const keyEncryptionKey = await deriveMasterKey("CorrectHorseBatteryStaple!", salt, 10_000);
    const wrapped = await wrapVaultKey(generateVaultKey(), keyEncryptionKey);
    const tamperedCiphertext = base64ToBytes(wrapped.ciphertext);
    tamperedCiphertext[0] ^= 1;

    await expect(unwrapVaultKey(
      { ...wrapped, ciphertext: bytesToBase64(tamperedCiphertext) },
      keyEncryptionKey,
    )).rejects.toBeDefined();
  });

  it("rates longer varied passphrases above simple patterns", () => {
    expect(evaluatePasswordStrength("password123").score)
      .toBeLessThan(evaluatePasswordStrength("A long, unique vault phrase! 2049").score);
    expect(evaluatePasswordStrength("").label).toBe("Very Weak");
  });

  it("validates empty, short, mismatched, and valid master-password input", () => {
    expect(validateCreateVaultInput("", "").isValid).toBe(false);
    expect(validateCreateVaultInput("short", "short").isValid).toBe(false);
    expect(validateCreateVaultInput("A sufficiently long phrase", "different phrase").isValid).toBe(false);
    expect(validateCreateVaultInput("A sufficiently long phrase", "A sufficiently long phrase").isValid).toBe(true);
  });
});
