import {
  AES_GCM_IV_BYTES,
  KDF_ALGORITHM,
  KDF_HASH,
  KDF_ITERATIONS,
  KDF_SALT_BYTES,
  MAX_SUPPORTED_KDF_ITERATIONS,
  MIN_SUPPORTED_KDF_ITERATIONS,
} from "./constants";
import { generateSecureRandomBytes } from "./crypto";
import { base64ToBytes, bytesToArrayBuffer, bytesToBase64, isValidBase64 } from "./encoding";
import { deriveMasterKey } from "./kdf";
import type { VaultKeyBackupPayloadV1, VaultKeyBackupV1 } from "../types/backup";

export const BACKUP_AAD = "VaultKeyBrowser:Backup:v1";
const backupAad = bytesToArrayBuffer(new TextEncoder().encode(BACKUP_AAD));

export function isValidBackupContainer(value: unknown): value is VaultKeyBackupV1 {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const item = value as Record<string, any>;
  if (item.magic !== "VAULTKEY_BACKUP" || item.version !== 1 || !Number.isFinite(Date.parse(item.createdAt))) return false;
  if (!item.kdf || !item.encryption || item.kdf.algorithm !== KDF_ALGORITHM || item.kdf.hash !== KDF_HASH || item.encryption.algorithm !== "AES-GCM") return false;
  if (!Number.isInteger(item.kdf.iterations) || item.kdf.iterations < MIN_SUPPORTED_KDF_ITERATIONS || item.kdf.iterations > MAX_SUPPORTED_KDF_ITERATIONS) return false;
  if (!isValidBase64(item.kdf.salt) || !isValidBase64(item.encryption.iv) || !isValidBase64(item.encryption.ciphertext)) return false;
  try {
    return base64ToBytes(item.kdf.salt).byteLength >= KDF_SALT_BYTES && base64ToBytes(item.encryption.iv).byteLength === AES_GCM_IV_BYTES && base64ToBytes(item.encryption.ciphertext).byteLength > 16;
  } catch { return false; }
}

export async function encryptBackupPayload(payload: VaultKeyBackupPayloadV1, password: string): Promise<VaultKeyBackupV1> {
  const salt = generateSecureRandomBytes(KDF_SALT_BYTES);
  const iv = generateSecureRandomBytes(AES_GCM_IV_BYTES);
  const key = await deriveMasterKey(password, salt, KDF_ITERATIONS);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: bytesToArrayBuffer(iv), additionalData: backupAad }, key, bytesToArrayBuffer(plaintext));
  return {
    magic: "VAULTKEY_BACKUP",
    version: 1,
    kdf: { algorithm: KDF_ALGORITHM, hash: KDF_HASH, iterations: KDF_ITERATIONS, salt: bytesToBase64(salt) },
    encryption: { algorithm: "AES-GCM", iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ciphertext)) },
    createdAt: new Date().toISOString(),
  };
}

export async function decryptBackupPayload(container: VaultKeyBackupV1, password: string): Promise<unknown> {
  if (!isValidBackupContainer(container)) throw new TypeError("Invalid VaultKey backup.");
  const key = await deriveMasterKey(password, base64ToBytes(container.kdf.salt), container.kdf.iterations);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytesToArrayBuffer(base64ToBytes(container.encryption.iv)), additionalData: backupAad }, key, bytesToArrayBuffer(base64ToBytes(container.encryption.ciphertext)));
  return JSON.parse(new TextDecoder().decode(plaintext));
}
