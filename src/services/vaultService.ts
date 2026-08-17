import {
  KDF_ALGORITHM,
  KDF_HASH,
  KDF_ITERATIONS,
  KDF_SALT_BYTES,
  MIN_MASTER_PASSWORD_LENGTH,
  VAULT_FORMAT_VERSION,
} from "../security/constants";
import { generateSecureRandomBytes, generateVaultKey, unwrapVaultKey, wrapVaultKey } from "../security/crypto";
import { bytesToBase64, base64ToBytes } from "../security/encoding";
import { deriveMasterKey } from "../security/kdf";
import { createSession, isUnlocked } from "../security/session";
import { readVaultConfig, saveVaultConfig } from "../storage/vaultStorage";
import {
  VaultAlreadyExistsError,
  VaultConfigurationError,
  VaultUnlockError,
  type VaultConfig,
  type VaultStatus,
} from "../types/vault";
import { scheduleAutoLock } from "./activityService";
import { lockVaultSession } from "./lockService";
import { STORAGE_KEYS } from "../storage/storageKeys";

export async function vaultExists(): Promise<boolean> {
  return (await readVaultConfig()) !== null;
}

export async function createVault(masterPassword: string): Promise<void> {
  if (masterPassword.length < MIN_MASTER_PASSWORD_LENGTH) {
    throw new RangeError(`Master password must be at least ${MIN_MASTER_PASSWORD_LENGTH} characters.`);
  }
  if (await vaultExists()) throw new VaultAlreadyExistsError();

  const salt = generateSecureRandomBytes(KDF_SALT_BYTES);
  const vaultKey = generateVaultKey();
  const keyEncryptionKey = await deriveMasterKey(masterPassword, salt, KDF_ITERATIONS);
  const wrappedVaultKey = await wrapVaultKey(vaultKey, keyEncryptionKey);

  const config: VaultConfig = {
    version: VAULT_FORMAT_VERSION,
    kdf: {
      algorithm: KDF_ALGORITHM,
      hash: KDF_HASH,
      iterations: KDF_ITERATIONS,
      salt: bytesToBase64(salt),
    },
    wrappedVaultKey,
    createdAt: new Date().toISOString(),
  };

  await saveVaultConfig(config);
  await createSession(vaultKey);
  await chrome.storage.session.remove(STORAGE_KEYS.authNotice);
  await scheduleAutoLock();
}

export async function unlockVault(masterPassword: string): Promise<void> {
  const config = await readVaultConfig();
  if (!config) throw new VaultConfigurationError();

  let vaultKey: Uint8Array;
  try {
    const keyEncryptionKey = await deriveMasterKey(
      masterPassword,
      base64ToBytes(config.kdf.salt),
      config.kdf.iterations,
    );
    vaultKey = await unwrapVaultKey(config.wrappedVaultKey, keyEncryptionKey);
  } catch {
    throw new VaultUnlockError();
  }
  await createSession(vaultKey);
  await chrome.storage.session.remove(STORAGE_KEYS.authNotice);
  await scheduleAutoLock();
}

export async function lockVault(): Promise<void> {
  await lockVaultSession("manual");
}

export async function getVaultStatus(): Promise<VaultStatus> {
  try {
    const config = await readVaultConfig();
    if (!config) return "NO_VAULT";
    return (await isUnlocked()) ? "UNLOCKED" : "LOCKED";
  } catch (error) {
    if (error instanceof VaultConfigurationError) return "ERROR";
    return "ERROR";
  }
}
