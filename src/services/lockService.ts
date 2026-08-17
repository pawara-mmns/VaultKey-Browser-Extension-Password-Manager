import { STORAGE_KEYS } from "../storage/storageKeys";
import type { LockReason } from "../types/vault";
import { clearProtectedClipboard } from "./clipboardService";
import { AUTO_LOCK_ALARM, CLIPBOARD_CLEAR_ALARM } from "./runtimeConstants";

export async function lockVaultSession(_reason: LockReason): Promise<void> {
  try { await clearProtectedClipboard(); } catch { /* Clipboard cleanup is best effort. */ }
  await Promise.allSettled([
    chrome.alarms.clear(AUTO_LOCK_ALARM),
    chrome.alarms.clear(CLIPBOARD_CLEAR_ALARM),
  ]);
  await chrome.storage.session.remove([
    STORAGE_KEYS.vaultSession,
    STORAGE_KEYS.generatorSettings,
    STORAGE_KEYS.pendingCredentialPrefill,
    STORAGE_KEYS.clipboardProtection,
  ]);
}
