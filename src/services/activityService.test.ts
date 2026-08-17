import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateVaultKey } from "../security/crypto";
import { createSession, getSession } from "../security/session";
import { STORAGE_KEYS } from "../storage/storageKeys";
import { AUTO_LOCK_ALARM } from "./runtimeConstants";
import { handleAutoLockAlarm, recordActivity, scheduleAutoLock } from "./activityService";

let localData: Record<string, unknown>;
let sessionData: Record<string, unknown>;
let createAlarm: ReturnType<typeof vi.fn>;
let clearAlarm: ReturnType<typeof vi.fn>;

function area(data: Record<string, unknown>) {
  return {
    get: vi.fn(async (key?: string | string[]) => {
      if (typeof key === "string") return key in data ? { [key]: data[key] } : {};
      if (Array.isArray(key)) return Object.fromEntries(key.filter((item) => item in data).map((item) => [item, data[item]]));
      return { ...data };
    }),
    set: vi.fn(async (items: Record<string, unknown>) => { Object.assign(data, items); }),
    remove: vi.fn(async (keys: string | string[]) => { for (const key of Array.isArray(keys) ? keys : [keys]) delete data[key]; }),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-17T00:00:00.000Z"));
  localData = {};
  sessionData = {};
  createAlarm = vi.fn(async () => undefined);
  clearAlarm = vi.fn(async () => true);
  vi.stubGlobal("chrome", { storage: { local: area(localData), session: area(sessionData) }, alarms: { create: createAlarm, clear: clearAlarm } });
});

describe("timestamp-based Auto Lock", () => {
  it("records VaultKey activity and replaces the deadline alarm", async () => {
    await createSession(generateVaultKey());
    vi.setSystemTime(new Date("2026-08-17T00:00:30.000Z"));
    await recordActivity();
    expect((await getSession())?.lastActivityAt).toBe("2026-08-17T00:00:30.000Z");
    expect(createAlarm).toHaveBeenLastCalledWith(AUTO_LOCK_ALARM, { when: Date.parse("2026-08-17T00:05:30.000Z") });
  });

  it("does not schedule when Auto Lock is Never", async () => {
    localData[STORAGE_KEYS.settings] = { version: 1, autoLockMinutes: null, clipboardClearSeconds: null };
    await createSession(generateVaultKey());
    await scheduleAutoLock();
    expect(createAlarm).not.toHaveBeenCalled();
    expect(clearAlarm).toHaveBeenCalledWith(AUTO_LOCK_ALARM);
  });

  it("locks from actual elapsed time even if an alarm fires late", async () => {
    localData[STORAGE_KEYS.settings] = { version: 1, autoLockMinutes: 1, clipboardClearSeconds: null };
    await createSession(generateVaultKey());
    vi.setSystemTime(new Date("2026-08-17T00:02:00.000Z"));
    await handleAutoLockAlarm();
    expect(sessionData[STORAGE_KEYS.vaultSession]).toBeUndefined();
  });
});
