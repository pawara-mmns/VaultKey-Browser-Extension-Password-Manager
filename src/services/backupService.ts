import { decryptBackupPayload, encryptBackupPayload, isValidBackupContainer } from "../security/backupCrypto";
import { CREDENTIAL_COLLECTION_VERSION, type StoredCredentialCollection } from "../types/credential";
import type { VaultKeyBackupPayloadV1, VaultKeyBackupV1 } from "../types/backup";
import { isValidStoredCredential } from "../storage/credentialStorage";
import { STORAGE_KEYS } from "../storage/storageKeys";
import { isValidVaultConfig } from "../storage/vaultStorage";
import { getDefaultSettings, isValidSettings } from "./settingsService";
import { verifyMasterPassword } from "./masterPasswordService";
import { lockVaultSession } from "./lockService";

const persistentKeys = [STORAGE_KEYS.vaultConfig, STORAGE_KEYS.credentials, STORAGE_KEYS.settings];

function isValidCredentialCollection(value: unknown): value is StoredCredentialCollection {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const collection = value as { version?: unknown; records?: unknown };
  return collection.version === CREDENTIAL_COLLECTION_VERSION && Array.isArray(collection.records) && collection.records.every(isValidStoredCredential);
}

export function isValidBackupPayload(value: unknown): value is VaultKeyBackupPayloadV1 {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  return payload.version === 1 && isValidVaultConfig(payload.vaultConfig) && isValidCredentialCollection(payload.credentials) && isValidSettings(payload.settings);
}

export async function createEncryptedBackup(masterPassword: string): Promise<{ container: VaultKeyBackupV1; filename: string }> {
  await verifyMasterPassword(masterPassword);
  const stored = await chrome.storage.local.get(persistentKeys);
  const credentials = stored[STORAGE_KEYS.credentials] ?? { version: CREDENTIAL_COLLECTION_VERSION, records: [] };
  const settings = stored[STORAGE_KEYS.settings] ?? getDefaultSettings();
  const payload: unknown = { version: 1, vaultConfig: stored[STORAGE_KEYS.vaultConfig], credentials, settings };
  if (!isValidBackupPayload(payload)) throw new TypeError("VaultKey persistent data is not valid for backup.");
  const container = await encryptBackupPayload(payload, masterPassword);
  return { container, filename: `VaultKey-Backup-${container.createdAt.slice(0, 10)}.vkbak` };
}

export function serializeBackup(container: VaultKeyBackupV1): string {
  if (!isValidBackupContainer(container)) throw new TypeError("Invalid VaultKey backup container.");
  return JSON.stringify(container, null, 2);
}

export function parseBackup(serialized: string): VaultKeyBackupV1 {
  let parsed: unknown;
  try { parsed = JSON.parse(serialized); } catch { throw new TypeError("Invalid VaultKey backup file."); }
  if (!isValidBackupContainer(parsed)) throw new TypeError("Invalid VaultKey backup file.");
  return parsed;
}

export async function unlockBackup(serialized: string, masterPassword: string): Promise<VaultKeyBackupPayloadV1> {
  const decrypted = await decryptBackupPayload(parseBackup(serialized), masterPassword);
  if (!isValidBackupPayload(decrypted)) throw new TypeError("Invalid VaultKey backup payload.");
  return decrypted;
}

export async function restoreUnlockedBackup(payload: VaultKeyBackupPayloadV1): Promise<void> {
  if (!isValidBackupPayload(payload)) throw new TypeError("Invalid VaultKey backup payload.");
  const snapshot = await chrome.storage.local.get(persistentKeys);
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.vaultConfig]: payload.vaultConfig,
      [STORAGE_KEYS.credentials]: payload.credentials,
      [STORAGE_KEYS.settings]: payload.settings,
    });
  } catch (error) {
    try {
      await chrome.storage.local.set(snapshot);
      const originallyMissing = persistentKeys.filter((key) => !(key in snapshot));
      if (originallyMissing.length > 0) await chrome.storage.local.remove(originallyMissing);
    } catch { /* Preserve the original restore failure. */ }
    throw error;
  }
  try { await chrome.storage.session.set({ [STORAGE_KEYS.authNotice]: "Backup restored successfully. Unlock VaultKey using the restored vault's master password." }); } catch { /* The security lock must not depend on a UI notice. */ }
  await lockVaultSession("restore");
}
