import {
  KDF_ALGORITHM,
  KDF_HASH,
  KDF_ITERATIONS,
  KDF_SALT_BYTES,
  MIN_MASTER_PASSWORD_LENGTH,
  VAULT_FORMAT_VERSION,
} from "../security/constants";
import { generateSecureRandomBytes, unwrapVaultKey, wrapVaultKey } from "../security/crypto";
import { base64ToBytes, bytesToBase64 } from "../security/encoding";
import { deriveMasterKey } from "../security/kdf";
import { readVaultConfig, saveVaultConfig } from "../storage/vaultStorage";
import { VaultConfigurationError, VaultUnlockError, type VaultConfig } from "../types/vault";
import { lockVaultSession } from "./lockService";
import { STORAGE_KEYS } from "../storage/storageKeys";

export async function verifyMasterPassword(masterPassword: string): Promise<Uint8Array> {
  const config = await readVaultConfig();
  if (!config) throw new VaultConfigurationError();
  try {
    const keyEncryptionKey = await deriveMasterKey(masterPassword, base64ToBytes(config.kdf.salt), config.kdf.iterations);
    return await unwrapVaultKey(config.wrappedVaultKey, keyEncryptionKey);
  } catch {
    throw new VaultUnlockError();
  }
}

export async function changeMasterPassword(currentPassword: string, newPassword: string, confirmation: string): Promise<void> {
  if (newPassword.length < MIN_MASTER_PASSWORD_LENGTH) throw new RangeError(`New master password must be at least ${MIN_MASTER_PASSWORD_LENGTH} characters.`);
  if (newPassword !== confirmation) throw new RangeError("New master passwords do not match.");
  if (newPassword === currentPassword) throw new RangeError("Choose a new master password that differs from the current password.");

  const oldConfig = await readVaultConfig();
  if (!oldConfig) throw new VaultConfigurationError();
  const vaultKey = await verifyMasterPassword(currentPassword);
  const salt = generateSecureRandomBytes(KDF_SALT_BYTES);
  const newKeyEncryptionKey = await deriveMasterKey(newPassword, salt, KDF_ITERATIONS);
  const wrappedVaultKey = await wrapVaultKey(vaultKey, newKeyEncryptionKey);
  const nextConfig: VaultConfig = {
    version: VAULT_FORMAT_VERSION,
    kdf: { algorithm: KDF_ALGORITHM, hash: KDF_HASH, iterations: KDF_ITERATIONS, salt: bytesToBase64(salt) },
    wrappedVaultKey,
    createdAt: oldConfig.createdAt,
  };
  try {
    await saveVaultConfig(nextConfig);
  } catch (error) {
    try { await saveVaultConfig(oldConfig); } catch { /* Preserve the original write error. */ }
    throw error;
  }
  try { await chrome.storage.session.set({ [STORAGE_KEYS.authNotice]: "Master password changed successfully. Unlock VaultKey using your new password." }); } catch { /* The security lock must not depend on a UI notice. */ }
  await lockVaultSession("master-password-change");
}
