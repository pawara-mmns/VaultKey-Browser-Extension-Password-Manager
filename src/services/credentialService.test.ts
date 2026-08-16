import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, createSession } from "../security/session";
import { generateVaultKey } from "../security/crypto";
import { loadCredentialRecords } from "../storage/credentialStorage";
import { STORAGE_KEYS } from "../storage/storageKeys";
import {
  createCredential,
  deleteCredential,
  getCredential,
  listCredentialSummaries,
  searchCredentialSummaries,
  toggleCredentialFavorite,
  updateCredential,
} from "./credentialService";

function createArea(data: Record<string, unknown>) {
  return {
    get: vi.fn(async (key: string) => key in data ? { [key]: data[key] } : {}),
    set: vi.fn(async (items: Record<string, unknown>) => { Object.assign(data, items); }),
    remove: vi.fn(async (key: string) => { delete data[key]; }),
  };
}

let localData: Record<string, unknown>;
let sessionData: Record<string, unknown>;

beforeEach(async () => {
  localData = {};
  sessionData = {};
  vi.stubGlobal("chrome", { storage: { local: createArea(localData), session: createArea(sessionData) } });
  await createSession(generateVaultKey());
});

const github = {
  serviceName: "  GitHub  ",
  username: "user@example.test",
  password: "test-only-password-a",
  website: "github.com/login",
  notes: "Personal test note",
};

describe("credential service", () => {
  it("creates only an encrypted persistent record and decrypts it on demand", async () => {
    const summary = await createCredential(github);
    const persistent = JSON.stringify(localData);
    expect(persistent).not.toContain(github.username);
    expect(persistent).not.toContain(github.password);
    expect(persistent).not.toContain(github.notes);
    expect(persistent).toContain("GitHub");
    expect(Object.keys(localData)).toEqual([STORAGE_KEYS.credentials]);
    expect(Object.keys(sessionData)).toEqual([STORAGE_KEYS.vaultSession]);
    expect(JSON.stringify(sessionData)).not.toContain(github.username);
    expect(JSON.stringify(sessionData)).not.toContain(github.password);
    expect(JSON.stringify(sessionData)).not.toContain(github.notes);
    expect(await getCredential(summary.id)).toMatchObject({ serviceName: "GitHub", username: github.username, password: github.password });
  });

  it("updates with a fresh IV while preserving createdAt and deletes permanently", async () => {
    const created = await createCredential(github);
    const before = (await loadCredentialRecords()).records[0];
    await updateCredential(created.id, { ...github, username: "updated@example.test", password: "test-only-password-b" });
    const after = (await loadCredentialRecords()).records[0];
    expect(after.metadata.createdAt).toBe(before.metadata.createdAt);
    expect(Date.parse(after.metadata.updatedAt)).toBeGreaterThan(Date.parse(before.metadata.updatedAt));
    expect(after.encrypted.username.iv).not.toBe(before.encrypted.username.iv);
    expect(after.encrypted.secret.iv).not.toBe(before.encrypted.secret.iv);
    expect(after.encrypted.secret.ciphertext).not.toBe(before.encrypted.secret.ciphertext);
    expect((await getCredential(created.id)).username).toBe("updated@example.test");
    await deleteCredential(created.id);
    expect((await loadCredentialRecords()).records).toHaveLength(0);
  });

  it("fails safely while locked and leaves encrypted records persistent", async () => {
    const created = await createCredential(github);
    await clearSession();
    await expect(getCredential(created.id)).rejects.toThrow("Unlock VaultKey");
    expect((await loadCredentialRecords()).records).toHaveLength(1);
  });

  it("isolates corrupted and malformed records without silently deleting them", async () => {
    await createCredential(github);
    const collection = localData[STORAGE_KEYS.credentials] as { version: 1; records: Array<Record<string, unknown>> };
    const encrypted = collection.records[0].encrypted as { username: { ciphertext: string } };
    encrypted.username.ciphertext = encrypted.username.ciphertext.slice(0, -4) + "AAAA";
    collection.records.push({ version: 999, damaged: true });
    const { summaries, invalidRecordCount } = await listCredentialSummaries();
    expect(summaries).toHaveLength(1);
    expect(summaries[0].unreadable).toBe(true);
    expect(invalidRecordCount).toBe(1);
    await toggleCredentialFavorite(summaries[0].id);
    const storedAfterMutation = localData[STORAGE_KEYS.credentials] as { records: Array<Record<string, unknown>> };
    expect(storedAfterMutation.records.some((record) => record.damaged === true)).toBe(true);
  });

  it("toggles favorite without re-encrypting and searches service, website, and encrypted username", async () => {
    const first = await createCredential(github);
    await createCredential({ ...github, serviceName: "LinkedIn", username: "work-profile@example.test", website: "linkedin.com" });
    const ciphertext = (await loadCredentialRecords()).records.find((item) => item.id === first.id)?.encrypted.secret.ciphertext;
    expect(await toggleCredentialFavorite(first.id)).toBe(true);
    const records = (await loadCredentialRecords()).records;
    expect(records.find((item) => item.id === first.id)?.encrypted.secret.ciphertext).toBe(ciphertext);
    const { summaries } = await listCredentialSummaries();
    expect(searchCredentialSummaries(summaries, "Git").map((item) => item.serviceName)).toEqual(["GitHub"]);
    expect(searchCredentialSummaries(summaries, "linkedin.com")).toHaveLength(1);
    expect(searchCredentialSummaries(summaries, "work-profile")).toHaveLength(1);
  });

  it("derives hostname for a valid legacy record that does not contain hostname metadata", async () => {
    await createCredential(github);
    const collection = localData[STORAGE_KEYS.credentials] as { records: Array<{ metadata: { hostname?: string } }> };
    delete collection.records[0].metadata.hostname;
    const { summaries, invalidRecordCount } = await listCredentialSummaries();
    expect(invalidRecordCount).toBe(0);
    expect(summaries[0].hostname).toBe("github.com");
  });

  it("rejects malformed website input before writing a credential", async () => {
    await expect(createCredential({ ...github, website: "not a valid website" })).rejects.toThrow("valid HTTP or HTTPS website");
    expect(localData[STORAGE_KEYS.credentials]).toBeUndefined();
  });
});
