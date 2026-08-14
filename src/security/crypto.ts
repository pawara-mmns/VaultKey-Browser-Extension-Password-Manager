import type { VaultConfig } from "../types/vault";
import {
  AES_GCM_IV_BYTES,
  VAULT_KEY_BYTES,
  WRAPPED_VAULT_KEY_AAD,
  WRAPPING_ALGORITHM,
} from "./constants";
import { base64ToBytes, bytesToArrayBuffer, bytesToBase64 } from "./encoding";

const wrappedKeyAad = bytesToArrayBuffer(new TextEncoder().encode(WRAPPED_VAULT_KEY_AAD));

export function generateSecureRandomBytes(length: number): Uint8Array {
  if (!Number.isInteger(length) || length <= 0) {
    throw new RangeError("Random byte length must be a positive integer.");
  }
  return crypto.getRandomValues(new Uint8Array(length));
}

export function generateVaultKey(): Uint8Array {
  return generateSecureRandomBytes(VAULT_KEY_BYTES);
}

export async function wrapVaultKey(
  vaultKey: Uint8Array,
  keyEncryptionKey: CryptoKey,
): Promise<VaultConfig["wrappedVaultKey"]> {
  if (vaultKey.byteLength !== VAULT_KEY_BYTES) {
    throw new RangeError("Vault key has an invalid length.");
  }

  const iv = generateSecureRandomBytes(AES_GCM_IV_BYTES);
  const ciphertext = await crypto.subtle.encrypt(
    { name: WRAPPING_ALGORITHM, iv: bytesToArrayBuffer(iv), additionalData: wrappedKeyAad },
    keyEncryptionKey,
    bytesToArrayBuffer(vaultKey),
  );

  return {
    algorithm: WRAPPING_ALGORITHM,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

export async function unwrapVaultKey(
  wrappedVaultKey: VaultConfig["wrappedVaultKey"],
  keyEncryptionKey: CryptoKey,
): Promise<Uint8Array> {
  const plaintext = await crypto.subtle.decrypt(
    {
      name: WRAPPING_ALGORITHM,
      iv: bytesToArrayBuffer(base64ToBytes(wrappedVaultKey.iv)),
      additionalData: wrappedKeyAad,
    },
    keyEncryptionKey,
    bytesToArrayBuffer(base64ToBytes(wrappedVaultKey.ciphertext)),
  );

  const vaultKey = new Uint8Array(plaintext);
  if (vaultKey.byteLength !== VAULT_KEY_BYTES) {
    throw new Error("Invalid unwrapped key length.");
  }
  return vaultKey;
}
