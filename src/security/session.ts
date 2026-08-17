import { SESSION_FORMAT_VERSION, VAULT_KEY_BYTES } from "./constants";
import { base64ToBytes, bytesToBase64, isValidBase64 } from "./encoding";
import { STORAGE_KEYS } from "../storage/storageKeys";
import type { VaultSession } from "../types/vault";
import { VaultLockedError } from "../types/credential";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidVaultSession(value: unknown): value is VaultSession {
  if (
    !isRecord(value) ||
    value.version !== SESSION_FORMAT_VERSION ||
    value.unlocked !== true ||
    !isValidBase64(value.vaultKey) ||
    typeof value.unlockedAt !== "string" ||
    !Number.isFinite(Date.parse(value.unlockedAt)) ||
    typeof value.lastActivityAt !== "string" ||
    !Number.isFinite(Date.parse(value.lastActivityAt))
  ) return false;

  try {
    return base64ToBytes(value.vaultKey).byteLength === VAULT_KEY_BYTES;
  } catch {
    return false;
  }
}

export async function createSession(vaultKey: Uint8Array): Promise<void> {
  if (vaultKey.byteLength !== VAULT_KEY_BYTES) throw new RangeError("Vault key has an invalid length.");

  const timestamp = new Date().toISOString();
  const session: VaultSession = {
    version: SESSION_FORMAT_VERSION,
    unlocked: true,
    vaultKey: bytesToBase64(vaultKey),
    unlockedAt: timestamp,
    lastActivityAt: timestamp,
  };
  await chrome.storage.session.set({ [STORAGE_KEYS.vaultSession]: session });
}

export async function getSession(): Promise<VaultSession | null> {
  const result = await chrome.storage.session.get(STORAGE_KEYS.vaultSession);
  const storedValue: unknown = result[STORAGE_KEYS.vaultSession];
  if (storedValue === undefined) return null;
  if (isValidVaultSession(storedValue)) return storedValue;

  await clearSession();
  return null;
}

export async function isUnlocked(): Promise<boolean> {
  return (await getSession()) !== null;
}

export async function getActiveVaultKey(): Promise<Uint8Array> {
  const session = await getSession();
  if (!session) throw new VaultLockedError();
  return base64ToBytes(session.vaultKey);
}

export async function clearSession(): Promise<void> {
  await chrome.storage.session.remove(STORAGE_KEYS.vaultSession);
}

export async function updateSessionActivity(timestamp = new Date().toISOString()): Promise<VaultSession | null> {
  const session = await getSession();
  if (!session) return null;
  const updated = { ...session, lastActivityAt: timestamp };
  await chrome.storage.session.set({ [STORAGE_KEYS.vaultSession]: updated });
  return updated;
}
