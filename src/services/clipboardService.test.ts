// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../storage/storageKeys";
import { clearProtectedClipboard, protectCopiedPassword, rescheduleClipboardProtection, writePasswordToClipboard } from "./clipboardService";
import { CLIPBOARD_CLEAR_ALARM } from "./runtimeConstants";
import { lockVaultSession } from "./lockService";

let localData: Record<string, unknown>;
let sessionData: Record<string, unknown>;
let permissionGranted: boolean;
let sendMessage: ReturnType<typeof vi.fn>;
let writeText: ReturnType<typeof vi.fn>;

function area(data: Record<string, unknown>) {
  return {
    get: vi.fn(async (key: string) => key in data ? { [key]: data[key] } : {}),
    set: vi.fn(async (items: Record<string, unknown>) => { Object.assign(data, items); }),
    remove: vi.fn(async (keys: string | string[]) => { for (const key of Array.isArray(keys) ? keys : [keys]) delete data[key]; }),
  };
}

beforeEach(() => {
  localData = { [STORAGE_KEYS.settings]: { version: 1, autoLockMinutes: 5, clipboardClearSeconds: 30 } };
  sessionData = {};
  permissionGranted = true;
  sendMessage = vi.fn(async () => ({ cleared: true }));
  writeText = vi.fn(async () => undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  vi.stubGlobal("chrome", {
    storage: { local: area(localData), session: area(sessionData) },
    alarms: { create: vi.fn(async () => undefined), clear: vi.fn(async () => true) },
    permissions: { contains: vi.fn(async () => permissionGranted), request: vi.fn(async () => permissionGranted) },
    offscreen: { Reason: { CLIPBOARD: "CLIPBOARD" }, hasDocument: vi.fn(async () => false), createDocument: vi.fn(async () => undefined), closeDocument: vi.fn(async () => undefined) },
    runtime: { sendMessage },
  });
});

describe("clipboard clear-if-unchanged protection", () => {
  it("stores only a digest and replaces an older password deadline", async () => {
    await protectCopiedPassword("test-password-a");
    const first = sessionData[STORAGE_KEYS.clipboardProtection] as { digest: string; expiresAt: number };
    await protectCopiedPassword("test-password-b");
    const second = sessionData[STORAGE_KEYS.clipboardProtection] as { digest: string; expiresAt: number };

    expect(first.digest).not.toBe(second.digest);
    expect(JSON.stringify(sessionData)).not.toContain("test-password-a");
    expect(JSON.stringify(sessionData)).not.toContain("test-password-b");
    expect(chrome.alarms.create).toHaveBeenLastCalledWith(CLIPBOARD_CLEAR_ALARM, { when: second.expiresAt });
  });

  it("clears only through the offscreen digest comparison and then removes state", async () => {
    await protectCopiedPassword("test-password-a");
    await expect(clearProtectedClipboard()).resolves.toBe(true);
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({ type: "vaultkey.clipboard.clear-if-matches" }));
    expect(sessionData[STORAGE_KEYS.clipboardProtection]).toBeUndefined();
  });

  it("leaves newer clipboard content untouched when the digest does not match", async () => {
    sendMessage.mockResolvedValue({ cleared: false });
    await protectCopiedPassword("test-password-a");
    await expect(clearProtectedClipboard()).resolves.toBe(false);
    expect(sessionData[STORAGE_KEYS.clipboardProtection]).toBeUndefined();
  });

  it("keeps explicit copy working when optional permission is denied", async () => {
    permissionGranted = false;
    await writePasswordToClipboard("test-password-a");
    expect(writeText).toHaveBeenCalledOnce();
    expect(sessionData[STORAGE_KEYS.clipboardProtection]).toBeUndefined();
  });

  it("reschedules the current digest without storing plaintext when the timeout changes", async () => {
    await protectCopiedPassword("test-password-a");
    const before = sessionData[STORAGE_KEYS.clipboardProtection] as { expiresAt: number };
    await rescheduleClipboardProtection(60);
    const after = sessionData[STORAGE_KEYS.clipboardProtection] as { expiresAt: number };
    expect(after.expiresAt).toBeGreaterThan(before.expiresAt);
    expect(JSON.stringify(after)).not.toContain("test-password-a");
  });

  it("uses the same clear-if-matches path during manual lock", async () => {
    sessionData[STORAGE_KEYS.vaultSession] = { sensitive: true };
    await protectCopiedPassword("test-password-a");
    await lockVaultSession("manual");
    expect(sendMessage).toHaveBeenCalledOnce();
    expect(sessionData[STORAGE_KEYS.vaultSession]).toBeUndefined();
    expect(sessionData[STORAGE_KEYS.clipboardProtection]).toBeUndefined();
  });
});
