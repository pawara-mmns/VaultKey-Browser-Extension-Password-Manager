import { beforeEach, describe, expect, it, vi } from "vitest";
import { initializeStorageAccess } from "../storage/storageAccess";
import { STORAGE_KEYS } from "../storage/storageKeys";
import { isValidVaultConfig, readVaultConfig } from "../storage/vaultStorage";
import { VaultConfigurationError, VaultUnlockError } from "../types/vault";
import { clearSession } from "../security/session";
import { createVault, getVaultStatus, lockVault, unlockVault } from "./vaultService";

interface MemoryStorageArea {
  data: Record<string, unknown>;
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  setAccessLevel: ReturnType<typeof vi.fn>;
}

function createMemoryStorageArea(): MemoryStorageArea {
  const data: Record<string, unknown> = {};
  return {
    data,
    get: vi.fn(async (keys?: string | string[]) => {
      if (typeof keys === "string") return keys in data ? { [keys]: data[keys] } : {};
      if (Array.isArray(keys)) {
        return Object.fromEntries(keys.filter((key) => key in data).map((key) => [key, data[key]]));
      }
      return { ...data };
    }),
    set: vi.fn(async (items: Record<string, unknown>) => { Object.assign(data, items); }),
    remove: vi.fn(async (keys: string | string[]) => {
      for (const key of Array.isArray(keys) ? keys : [keys]) delete data[key];
    }),
    setAccessLevel: vi.fn(async () => undefined),
  };
}

let localArea: MemoryStorageArea;
let sessionArea: MemoryStorageArea;

beforeEach(() => {
  localArea = createMemoryStorageArea();
  sessionArea = createMemoryStorageArea();
  vi.stubGlobal("chrome", {
    storage: {
      local: localArea,
      session: sessionArea,
    },
    alarms: {
      create: vi.fn(async () => undefined),
      clear: vi.fn(async () => true),
    },
  });
});

describe("vault service", () => {
  it("reports first install and rejects short master passwords", async () => {
    expect(await getVaultStatus()).toBe("NO_VAULT");
    await expect(createVault("too-short")).rejects.toBeInstanceOf(RangeError);
    expect(localArea.data).toEqual({});
    expect(sessionArea.data).toEqual({});
  });

  it("creates a protected configuration and a session without password or KEK persistence", async () => {
    const masterPassword = "CorrectHorseBatteryStaple!";
    await createVault(masterPassword);

    const storedConfig = localArea.data[STORAGE_KEYS.vaultConfig];
    const storedSession = sessionArea.data[STORAGE_KEYS.vaultSession];
    const persistentJson = JSON.stringify(localArea.data);
    const sessionJson = JSON.stringify(sessionArea.data);

    expect(isValidVaultConfig(storedConfig)).toBe(true);
    expect(Object.keys(localArea.data)).toEqual([STORAGE_KEYS.vaultConfig]);
    expect(storedConfig).not.toHaveProperty("masterPassword");
    expect(storedConfig).not.toHaveProperty("vaultKey");
    expect(storedConfig).not.toHaveProperty("keyEncryptionKey");
    expect(persistentJson).not.toContain(masterPassword);
    expect(persistentJson).not.toContain("keyEncryptionKey");
    expect(storedSession).toMatchObject({ version: 1, unlocked: true });
    expect(storedSession).not.toHaveProperty("masterPassword");
    expect(storedSession).not.toHaveProperty("keyEncryptionKey");
    expect(sessionJson).not.toContain(masterPassword);
    expect(sessionJson).not.toContain("keyEncryptionKey");
    expect(persistentJson).not.toContain((storedSession as { vaultKey: string }).vaultKey);
    expect(await getVaultStatus()).toBe("UNLOCKED");
  });

  it("unlocks with the correct password and safely rejects a wrong password", async () => {
    await createVault("CorrectHorseBatteryStaple!");
    await clearSession();

    expect(await getVaultStatus()).toBe("LOCKED");
    await unlockVault("CorrectHorseBatteryStaple!");
    expect(await getVaultStatus()).toBe("UNLOCKED");

    await clearSession();
    await expect(unlockVault("An entirely wrong password"))
      .rejects.toBeInstanceOf(VaultUnlockError);
    expect(sessionArea.data).toEqual({});
  });

  it("clears only session data when locked", async () => {
    await createVault("CorrectHorseBatteryStaple!");
    const configBeforeLock = localArea.data[STORAGE_KEYS.vaultConfig];

    await lockVault();

    expect(sessionArea.data).toEqual({});
    expect(localArea.data[STORAGE_KEYS.vaultConfig]).toEqual(configBeforeLock);
    expect(await getVaultStatus()).toBe("LOCKED");
  });

  it("detects malformed persistent configuration without overwriting it", async () => {
    const damagedConfig = { version: 1, kdf: { algorithm: "PBKDF2" } };
    localArea.data[STORAGE_KEYS.vaultConfig] = damagedConfig;

    await expect(readVaultConfig()).rejects.toBeInstanceOf(VaultConfigurationError);
    expect(await getVaultStatus()).toBe("ERROR");
    await expect(createVault("CorrectHorseBatteryStaple!"))
      .rejects.toBeInstanceOf(VaultConfigurationError);
    expect(localArea.data[STORAGE_KEYS.vaultConfig]).toBe(damagedConfig);
  });

  it("restricts local and session storage to trusted extension contexts", async () => {
    await initializeStorageAccess();
    expect(localArea.setAccessLevel).toHaveBeenCalledWith({ accessLevel: "TRUSTED_CONTEXTS" });
    expect(sessionArea.setAccessLevel).toHaveBeenCalledWith({ accessLevel: "TRUSTED_CONTEXTS" });
  });
});
