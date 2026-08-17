export const SETTINGS_FORMAT_VERSION = 1 as const;

export const AUTO_LOCK_OPTIONS = [1, 5, 10, 15, 30, null] as const;
export const CLIPBOARD_CLEAR_OPTIONS = [30, 60, 120, 300, null] as const;

export interface VaultKeySettings {
  version: typeof SETTINGS_FORMAT_VERSION;
  autoLockMinutes: number | null;
  clipboardClearSeconds: number | null;
}

export interface ClipboardProtectionState {
  version: 1;
  digest: string;
  expiresAt: number;
}
