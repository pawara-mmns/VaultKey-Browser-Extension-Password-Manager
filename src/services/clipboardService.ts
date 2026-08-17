import { bytesToBase64, isValidBase64 } from "../security/encoding";
import { STORAGE_KEYS } from "../storage/storageKeys";
import type { ClipboardProtectionState } from "../types/settings";
import { CLIPBOARD_CLEAR_ALARM } from "./runtimeConstants";
import { loadSettings } from "./settingsService";

const clipboardPermissions: chrome.permissions.Permissions = { permissions: ["clipboardRead", "clipboardWrite"] };

function isClipboardState(value: unknown): value is ClipboardProtectionState {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const state = value as Record<string, unknown>;
  return state.version === 1 && isValidBase64(state.digest) && typeof state.expiresAt === "number" && Number.isFinite(state.expiresAt);
}

async function digestText(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64(new Uint8Array(digest));
}

export async function hasClipboardProtectionPermission(): Promise<boolean> {
  try { return await chrome.permissions.contains(clipboardPermissions); } catch { return false; }
}

export async function requestClipboardProtectionPermission(): Promise<boolean> {
  try { return await chrome.permissions.request(clipboardPermissions); } catch { return false; }
}

async function ensureOffscreenDocument(): Promise<void> {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: [chrome.offscreen.Reason.CLIPBOARD],
    justification: "Verify and clear only passwords copied by VaultKey.",
  });
}

async function closeOffscreenDocument(): Promise<void> {
  try { if (await chrome.offscreen.hasDocument()) await chrome.offscreen.closeDocument(); } catch { /* Best effort. */ }
}

async function sendClipboardOperation(expectedDigest: string): Promise<boolean> {
  await ensureOffscreenDocument();
  try {
    const response = await chrome.runtime.sendMessage({ type: "vaultkey.clipboard.clear-if-matches", expectedDigest });
    return response?.cleared === true;
  } finally {
    await closeOffscreenDocument();
  }
}

export async function protectCopiedPassword(password: string): Promise<void> {
  const settings = await loadSettings();
  if (settings.clipboardClearSeconds === null || !(await hasClipboardProtectionPermission())) return;
  const state: ClipboardProtectionState = {
    version: 1,
    digest: await digestText(password),
    expiresAt: Date.now() + settings.clipboardClearSeconds * 1000,
  };
  await chrome.storage.session.set({ [STORAGE_KEYS.clipboardProtection]: state });
  await chrome.alarms.create(CLIPBOARD_CLEAR_ALARM, { when: state.expiresAt });
}

export async function writePasswordToClipboard(password: string): Promise<void> {
  await navigator.clipboard.writeText(password);
  try { await protectCopiedPassword(password); } catch { /* Explicit copy remains available if protection setup fails. */ }
}

export async function clearProtectedClipboard(): Promise<boolean> {
  const result = await chrome.storage.session.get(STORAGE_KEYS.clipboardProtection);
  const state = result[STORAGE_KEYS.clipboardProtection];
  if (!isClipboardState(state)) {
    await Promise.all([chrome.storage.session.remove(STORAGE_KEYS.clipboardProtection), chrome.alarms.clear(CLIPBOARD_CLEAR_ALARM)]);
    return false;
  }
  let cleared = false;
  try {
    if (await hasClipboardProtectionPermission()) cleared = await sendClipboardOperation(state.digest);
  } finally {
    await chrome.storage.session.remove(STORAGE_KEYS.clipboardProtection);
    await chrome.alarms.clear(CLIPBOARD_CLEAR_ALARM);
  }
  return cleared;
}

export async function cancelClipboardProtection(): Promise<void> {
  await Promise.all([
    chrome.storage.session.remove(STORAGE_KEYS.clipboardProtection),
    chrome.alarms.clear(CLIPBOARD_CLEAR_ALARM),
  ]);
}

export async function rescheduleClipboardProtection(seconds: number): Promise<void> {
  const result = await chrome.storage.session.get(STORAGE_KEYS.clipboardProtection);
  const state = result[STORAGE_KEYS.clipboardProtection];
  if (!isClipboardState(state)) return;
  const updated: ClipboardProtectionState = { ...state, expiresAt: Date.now() + seconds * 1000 };
  await chrome.storage.session.set({ [STORAGE_KEYS.clipboardProtection]: updated });
  await chrome.alarms.create(CLIPBOARD_CLEAR_ALARM, { when: updated.expiresAt });
}

export async function handleClipboardClearAlarm(): Promise<void> {
  const result = await chrome.storage.session.get(STORAGE_KEYS.clipboardProtection);
  const state = result[STORAGE_KEYS.clipboardProtection];
  if (!isClipboardState(state)) {
    await cancelClipboardProtection();
    return;
  }
  if (state.expiresAt > Date.now()) {
    await chrome.alarms.create(CLIPBOARD_CLEAR_ALARM, { when: state.expiresAt });
    return;
  }
  await clearProtectedClipboard();
}

export async function restoreClipboardAlarm(): Promise<void> {
  const result = await chrome.storage.session.get(STORAGE_KEYS.clipboardProtection);
  const state = result[STORAGE_KEYS.clipboardProtection];
  if (!isClipboardState(state)) { await cancelClipboardProtection(); return; }
  if (state.expiresAt <= Date.now()) await clearProtectedClipboard();
  else await chrome.alarms.create(CLIPBOARD_CLEAR_ALARM, { when: state.expiresAt });
}
