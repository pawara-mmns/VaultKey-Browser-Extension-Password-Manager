import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCredential, getCredential } from "./credentialService";
import { changeMasterPassword } from "./masterPasswordService";
import { createVault, unlockVault } from "./vaultService";
import { createEncryptedBackup, restoreUnlockedBackup, serializeBackup, unlockBackup } from "./backupService";
import { resetLocalVault } from "./resetService";
import { STORAGE_KEYS } from "../storage/storageKeys";
import { VaultUnlockError } from "../types/vault";

interface MemoryArea {
  data: Record<string, unknown>;
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  failNextSet: boolean;
}

function memoryArea(): MemoryArea {
  const area: MemoryArea = {
    data: {},
    failNextSet: false,
    get: vi.fn(), set: vi.fn(), remove: vi.fn(),
  };
  area.get.mockImplementation(async (keys?: string | string[]) => {
    if (typeof keys === "string") return keys in area.data ? { [keys]: area.data[keys] } : {};
    if (Array.isArray(keys)) return Object.fromEntries(keys.filter((key) => key in area.data).map((key) => [key, area.data[key]]));
    return { ...area.data };
  });
  area.set.mockImplementation(async (items: Record<string, unknown>) => {
    if (area.failNextSet) { area.failNextSet = false; throw new Error("simulated write failure"); }
    Object.assign(area.data, items);
  });
  area.remove.mockImplementation(async (keys: string | string[]) => { for (const key of Array.isArray(keys) ? keys : [keys]) delete area.data[key]; });
  return area;
}

let local: MemoryArea;
let session: MemoryArea;

const oldPassword = "Correct Horse Battery Staple!";
const newPassword = "New Correct Horse Battery Staple!";
const credentialInput = { serviceName: "Example Service", username: "account@example.test", password: "credential-test-secret", website: "https://example.com/login", notes: "private test note" };

beforeEach(() => {
  local = memoryArea(); session = memoryArea();
  vi.stubGlobal("chrome", {
    storage: { local, session },
    alarms: { create: vi.fn(async () => undefined), clear: vi.fn(async () => true) },
  });
});

describe("Phase 07 security management", () => {
  it("changes the master password by re-wrapping the same Vault Key without changing credential ciphertext", async () => {
    await createVault(oldPassword);
    const created = await createCredential(credentialInput);
    const credentialCiphertext = JSON.stringify(local.data[STORAGE_KEYS.credentials]);

    await expect(changeMasterPassword("wrong current password", newPassword, newPassword)).rejects.toBeInstanceOf(VaultUnlockError);
    await expect(changeMasterPassword(oldPassword, "too short", "too short")).rejects.toBeInstanceOf(RangeError);
    await expect(changeMasterPassword(oldPassword, newPassword, `${newPassword} mismatch`)).rejects.toBeInstanceOf(RangeError);
    await changeMasterPassword(oldPassword, newPassword, newPassword);

    expect(JSON.stringify(local.data[STORAGE_KEYS.credentials])).toBe(credentialCiphertext);
    await expect(unlockVault(oldPassword)).rejects.toBeInstanceOf(VaultUnlockError);
    await unlockVault(newPassword);
    const restored = await getCredential(created.id);
    expect(restored.username).toBe(credentialInput.username);
    expect(restored.password).toBe(credentialInput.password);
  });

  it("creates a versioned encrypted backup that hides all vault metadata", async () => {
    await createVault(oldPassword);
    await createCredential(credentialInput);
    const { container, filename } = await createEncryptedBackup(oldPassword);
    const serialized = serializeBackup(container);

    expect(filename).toMatch(/^VaultKey-Backup-\d{4}-\d{2}-\d{2}\.vkbak$/);
    expect(container).toMatchObject({ magic: "VAULTKEY_BACKUP", version: 1, encryption: { algorithm: "AES-GCM" } });
    for (const plaintext of [credentialInput.serviceName, credentialInput.username, credentialInput.password, credentialInput.website, credentialInput.notes]) {
      expect(serialized).not.toContain(plaintext);
    }
    const activeVaultKey = (session.data[STORAGE_KEYS.vaultSession] as { vaultKey: string }).vaultKey;
    expect(serialized).not.toContain(activeVaultKey);
  });

  it("rejects wrong or corrupted backup authentication without mutating the current vault", async () => {
    await createVault(oldPassword);
    await createCredential(credentialInput);
    const { container } = await createEncryptedBackup(oldPassword);
    const before = JSON.stringify(local.data);

    await expect(unlockBackup(serializeBackup(container), "wrong backup password")).rejects.toThrow();
    const corrupted = structuredClone(container);
    corrupted.encryption.ciphertext = `${corrupted.encryption.ciphertext.slice(0, -4)}AAAA`;
    await expect(unlockBackup(serializeBackup(corrupted), oldPassword)).rejects.toThrow();
    const invalidVersion = { ...container, version: 2 };
    await expect(unlockBackup(JSON.stringify(invalidVersion), oldPassword)).rejects.toThrow();
    expect(JSON.stringify(local.data)).toBe(before);
  });

  it("restores only after full validation and locks for the restored master password", async () => {
    await createVault(oldPassword);
    const created = await createCredential(credentialInput);
    const { container } = await createEncryptedBackup(oldPassword);
    const payload = await unlockBackup(serializeBackup(container), oldPassword);
    local.data[STORAGE_KEYS.settings] = { version: 1, autoLockMinutes: null, clipboardClearSeconds: null };

    await restoreUnlockedBackup(payload);
    expect(session.data[STORAGE_KEYS.vaultSession]).toBeUndefined();
    await unlockVault(oldPassword);
    expect((await getCredential(created.id)).serviceName).toBe(credentialInput.serviceName);
  });

  it("rolls back a failed restore write and reset removes only VaultKey-owned local keys", async () => {
    await createVault(oldPassword);
    const { container } = await createEncryptedBackup(oldPassword);
    const payload = await unlockBackup(serializeBackup(container), oldPassword);
    local.data["unrelated.extension.data"] = { keep: true };
    const before = JSON.stringify(local.data);
    local.failNextSet = true;
    await expect(restoreUnlockedBackup(payload)).rejects.toThrow("simulated write failure");
    expect(JSON.stringify(local.data)).toBe(before);

    await expect(resetLocalVault("reset")).rejects.toBeInstanceOf(RangeError);
    await resetLocalVault("RESET");
    expect(local.data[STORAGE_KEYS.vaultConfig]).toBeUndefined();
    expect(local.data[STORAGE_KEYS.credentials]).toBeUndefined();
    expect(local.data[STORAGE_KEYS.settings]).toBeUndefined();
    expect(local.data["unrelated.extension.data"]).toEqual({ keep: true });
  });
});
