import { STORAGE_KEYS } from "../storage/storageKeys";

interface PendingCredentialPrefill {
  version: 1;
  website: string;
  createdAt: string;
}

const MAX_PREFILL_AGE_MS = 60_000;

export async function savePendingCredentialPrefill(website: string): Promise<void> {
  const value = website.trim();
  if (!value) return;
  const prefill: PendingCredentialPrefill = { version: 1, website: value, createdAt: new Date().toISOString() };
  await chrome.storage.session.set({ [STORAGE_KEYS.pendingCredentialPrefill]: prefill });
}

export async function consumePendingCredentialPrefill(): Promise<string> {
  const result = await chrome.storage.session.get(STORAGE_KEYS.pendingCredentialPrefill);
  await chrome.storage.session.remove(STORAGE_KEYS.pendingCredentialPrefill);
  const value: unknown = result[STORAGE_KEYS.pendingCredentialPrefill];
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "";
  const prefill = value as Record<string, unknown>;
  if (prefill.version !== 1 || typeof prefill.website !== "string" || typeof prefill.createdAt !== "string") return "";
  const age = Date.now() - Date.parse(prefill.createdAt);
  return Number.isFinite(age) && age >= 0 && age <= MAX_PREFILL_AGE_MS ? prefill.website : "";
}

