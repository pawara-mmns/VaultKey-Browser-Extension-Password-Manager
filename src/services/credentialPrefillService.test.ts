import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../storage/storageKeys";
import { consumePendingCredentialPrefill, savePendingCredentialPrefill } from "./credentialPrefillService";

let sessionData: Record<string, unknown>;

beforeEach(() => {
  sessionData = {};
  vi.stubGlobal("chrome", {
    storage: {
      session: {
        get: vi.fn(async (key: string) => key in sessionData ? { [key]: sessionData[key] } : {}),
        set: vi.fn(async (items: Record<string, unknown>) => { Object.assign(sessionData, items); }),
        remove: vi.fn(async (key: string) => { delete sessionData[key]; }),
      },
    },
  });
});

describe("one-time credential prefill", () => {
  it("passes a current URL once and removes it immediately after consumption", async () => {
    const currentUrl = "https://github.com/login";
    await savePendingCredentialPrefill(currentUrl);
    expect(sessionData[STORAGE_KEYS.pendingCredentialPrefill]).toBeDefined();
    expect(await consumePendingCredentialPrefill()).toBe(currentUrl);
    expect(sessionData[STORAGE_KEYS.pendingCredentialPrefill]).toBeUndefined();
    expect(await consumePendingCredentialPrefill()).toBe("");
  });

  it("removes and ignores expired or malformed values", async () => {
    sessionData[STORAGE_KEYS.pendingCredentialPrefill] = { version: 1, website: "https://example.com", createdAt: "2020-01-01T00:00:00.000Z" };
    expect(await consumePendingCredentialPrefill()).toBe("");
    expect(sessionData).toEqual({});
  });
});

