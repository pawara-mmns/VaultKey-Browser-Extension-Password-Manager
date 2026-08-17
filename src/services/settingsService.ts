import { STORAGE_KEYS } from "../storage/storageKeys";
import {
  AUTO_LOCK_OPTIONS,
  CLIPBOARD_CLEAR_OPTIONS,
  SETTINGS_FORMAT_VERSION,
  type VaultKeySettings,
} from "../types/settings";

const defaults: VaultKeySettings = { version: SETTINGS_FORMAT_VERSION, autoLockMinutes: 5, clipboardClearSeconds: null };

export function getDefaultSettings(): VaultKeySettings {
  return { ...defaults };
}

export function isValidSettings(value: unknown): value is VaultKeySettings {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const settings = value as Record<string, unknown>;
  return settings.version === SETTINGS_FORMAT_VERSION &&
    AUTO_LOCK_OPTIONS.includes(settings.autoLockMinutes as typeof AUTO_LOCK_OPTIONS[number]) &&
    CLIPBOARD_CLEAR_OPTIONS.includes(settings.clipboardClearSeconds as typeof CLIPBOARD_CLEAR_OPTIONS[number]);
}

export function validateSettings(value: unknown): VaultKeySettings {
  return isValidSettings(value) ? { ...value } : getDefaultSettings();
}

export async function loadSettings(): Promise<VaultKeySettings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.settings);
  return validateSettings(result[STORAGE_KEYS.settings]);
}

export async function saveSettings(settings: VaultKeySettings): Promise<void> {
  if (!isValidSettings(settings)) throw new TypeError("VaultKey settings are invalid.");
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: settings });
}
