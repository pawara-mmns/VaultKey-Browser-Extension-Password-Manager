import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../storage/storageKeys";
import { getDefaultSettings, loadSettings, saveSettings, validateSettings } from "./settingsService";

let localData: Record<string, unknown>;

beforeEach(() => {
  localData = {};
  vi.stubGlobal("chrome", { storage: { local: {
    get: vi.fn(async (key: string) => key in localData ? { [key]: localData[key] } : {}),
    set: vi.fn(async (items: Record<string, unknown>) => { Object.assign(localData, items); }),
  } } });
});

describe("persistent security settings", () => {
  it("uses safe defaults when settings are absent or malformed", async () => {
    expect(await loadSettings()).toEqual({ version: 1, autoLockMinutes: 5, clipboardClearSeconds: null });
    localData[STORAGE_KEYS.settings] = { version: 1, autoLockMinutes: -1, clipboardClearSeconds: "secret" };
    expect(await loadSettings()).toEqual(getDefaultSettings());
  });

  it("accepts only enumerated non-secret settings", async () => {
    const settings = { version: 1 as const, autoLockMinutes: 10, clipboardClearSeconds: 60 };
    await saveSettings(settings);
    expect(localData[STORAGE_KEYS.settings]).toEqual(settings);
    expect(validateSettings({ ...settings, autoLockMinutes: 2 })).toEqual(getDefaultSettings());
    await expect(saveSettings({ ...settings, clipboardClearSeconds: 1 })).rejects.toBeInstanceOf(TypeError);
  });
});
