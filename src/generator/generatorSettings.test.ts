import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_GENERATOR_OPTIONS } from "../security/passwordGenerator";
import { STORAGE_KEYS } from "../storage/storageKeys";
import { getGeneratorSettings, saveGeneratorSettings } from "./generatorSettings";

let sessionData: Record<string, unknown>;

beforeEach(() => {
  sessionData = {};
  vi.stubGlobal("chrome", {
    storage: {
      session: {
        get: vi.fn(async (key: string) => key in sessionData ? { [key]: sessionData[key] } : {}),
        set: vi.fn(async (items: Record<string, unknown>) => { Object.assign(sessionData, items); }),
      },
    },
  });
});

describe("session-only generator settings", () => {
  it("uses secure defaults when no session settings exist", async () => {
    expect(await getGeneratorSettings()).toEqual(DEFAULT_GENERATOR_OPTIONS);
  });

  it("stores only validated options under a separate session key", async () => {
    const settings = { ...DEFAULT_GENERATOR_OPTIONS, length: 32, symbols: false, excludeAmbiguous: true };
    await saveGeneratorSettings(settings);

    expect(Object.keys(sessionData)).toEqual([STORAGE_KEYS.generatorSettings]);
    expect(sessionData[STORAGE_KEYS.generatorSettings]).toEqual({ version: 1, ...settings });
    expect(JSON.stringify(sessionData)).not.toContain("generatedPassword");
    expect(await getGeneratorSettings()).toEqual(settings);
  });

  it("rejects invalid settings and safely ignores malformed session data", async () => {
    await expect(saveGeneratorSettings({ ...DEFAULT_GENERATOR_OPTIONS, uppercase: false, lowercase: false, numbers: false, symbols: false }))
      .rejects.toBeInstanceOf(RangeError);
    sessionData[STORAGE_KEYS.generatorSettings] = { version: 1, length: 999 };
    expect(await getGeneratorSettings()).toEqual(DEFAULT_GENERATOR_OPTIONS);
  });
});
