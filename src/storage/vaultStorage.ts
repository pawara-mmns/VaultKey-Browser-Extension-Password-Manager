import {
  AES_GCM_IV_BYTES,
  KDF_ALGORITHM,
  KDF_HASH,
  KDF_SALT_BYTES,
  MAX_SUPPORTED_KDF_ITERATIONS,
  MIN_SUPPORTED_KDF_ITERATIONS,
  VAULT_FORMAT_VERSION,
  VAULT_KEY_BYTES,
  WRAPPING_ALGORITHM,
} from "../security/constants";
import { base64ToBytes, isValidBase64 } from "../security/encoding";
import { VaultConfigurationError, type VaultConfig } from "../types/vault";
import { STORAGE_KEYS } from "./storageKeys";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasValidTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}

export function isValidVaultConfig(value: unknown): value is VaultConfig {
  if (!isRecord(value) || value.version !== VAULT_FORMAT_VERSION || !hasValidTimestamp(value.createdAt)) return false;
  if (!isRecord(value.kdf) || !isRecord(value.wrappedVaultKey)) return false;

  const { kdf, wrappedVaultKey } = value;
  if (
    kdf.algorithm !== KDF_ALGORITHM ||
    kdf.hash !== KDF_HASH ||
    !Number.isInteger(kdf.iterations) ||
    (kdf.iterations as number) < MIN_SUPPORTED_KDF_ITERATIONS ||
    (kdf.iterations as number) > MAX_SUPPORTED_KDF_ITERATIONS ||
    !isValidBase64(kdf.salt)
  ) return false;

  if (
    wrappedVaultKey.algorithm !== WRAPPING_ALGORITHM ||
    !isValidBase64(wrappedVaultKey.iv) ||
    !isValidBase64(wrappedVaultKey.ciphertext)
  ) return false;

  try {
    return base64ToBytes(kdf.salt).byteLength >= KDF_SALT_BYTES &&
      base64ToBytes(wrappedVaultKey.iv).byteLength === AES_GCM_IV_BYTES &&
      base64ToBytes(wrappedVaultKey.ciphertext).byteLength === VAULT_KEY_BYTES + 16;
  } catch {
    return false;
  }
}

export async function readVaultConfig(): Promise<VaultConfig | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.vaultConfig);
  const storedValue: unknown = result[STORAGE_KEYS.vaultConfig];
  if (storedValue === undefined) return null;
  if (!isValidVaultConfig(storedValue)) throw new VaultConfigurationError();
  return storedValue;
}

export async function saveVaultConfig(config: VaultConfig): Promise<void> {
  if (!isValidVaultConfig(config)) throw new VaultConfigurationError();
  await chrome.storage.local.set({ [STORAGE_KEYS.vaultConfig]: config });
}
