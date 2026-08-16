import { decryptCredentialSecret, decryptCredentialUsername, encryptCredentialSecret } from "../security/credentialCrypto";
import { getActiveVaultKey } from "../security/session";
import { loadCredentialRecords, mutateCredentialRecords } from "../storage/credentialStorage";
import {
  CREDENTIAL_FORMAT_VERSION,
  CredentialNotFoundError,
  type CredentialInput,
  type CredentialMetadata,
  type CredentialSummary,
  type DecryptedCredential,
  type StoredCredential,
} from "../types/credential";

export function normalizeWebsite(value: string): { website: string; hostname: string } {
  const trimmed = value.trim();
  if (!trimmed) return { website: "", hostname: "" };
  try {
    const parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return { website: trimmed, hostname: "" };
    return { website: parsed.href, hostname: parsed.hostname.toLowerCase() };
  } catch {
    return { website: trimmed, hostname: "" };
  }
}

function normalizeInput(input: CredentialInput): CredentialInput {
  return {
    serviceName: input.serviceName.trim().replace(/\s+/g, " "),
    username: input.username.trim(),
    password: input.password,
    website: input.website.trim(),
    notes: input.notes.trim(),
  };
}

function validateInput(input: CredentialInput): void {
  if (!input.serviceName) throw new RangeError("Service name is required.");
  if (!input.password) throw new RangeError("Password is required.");
}

function createId(): string {
  if (typeof crypto.randomUUID !== "function") throw new Error("Secure credential ID generation is unavailable.");
  return crypto.randomUUID();
}

function nextUpdatedAt(previous: string): string {
  const now = Date.now();
  const previousTime = Date.parse(previous);
  return new Date(now > previousTime ? now : previousTime + 1).toISOString();
}

export async function createCredential(rawInput: CredentialInput): Promise<CredentialSummary> {
  const input = normalizeInput(rawInput);
  validateInput(input);
  const vaultKey = await getActiveVaultKey();
  const id = createId();
  const timestamp = new Date().toISOString();
  const site = normalizeWebsite(input.website);
  const metadata: CredentialMetadata = {
    serviceName: input.serviceName,
    website: site.website,
    hostname: site.hostname,
    favorite: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const encrypted = await encryptCredentialSecret({ username: input.username, password: input.password, notes: input.notes }, id, vaultKey);
  const record: StoredCredential = { id, version: CREDENTIAL_FORMAT_VERSION, metadata, encrypted };
  await mutateCredentialRecords((records) => ({ records: [...records, record], result: undefined }));
  return { id, ...metadata, username: input.username, unreadable: false };
}

export async function listCredentialSummaries(): Promise<{ summaries: CredentialSummary[]; invalidRecordCount: number }> {
  const [{ records, invalidRecordCount }, vaultKey] = await Promise.all([loadCredentialRecords(), getActiveVaultKey()]);
  const summaries = await Promise.all(records.map(async (record): Promise<CredentialSummary> => {
    try {
      const username = await decryptCredentialUsername(record.encrypted, record.id, vaultKey);
      return { id: record.id, ...record.metadata, username, unreadable: false };
    } catch {
      return { id: record.id, ...record.metadata, username: "Unable to read", unreadable: true };
    }
  }));
  summaries.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return { summaries, invalidRecordCount };
}

export async function getCredential(id: string): Promise<DecryptedCredential> {
  const [{ records }, vaultKey] = await Promise.all([loadCredentialRecords(), getActiveVaultKey()]);
  const record = records.find((item) => item.id === id);
  if (!record) throw new CredentialNotFoundError();
  const secret = await decryptCredentialSecret(record.encrypted, record.id, vaultKey);
  return { id: record.id, ...record.metadata, ...secret };
}

export async function updateCredential(id: string, rawInput: CredentialInput): Promise<void> {
  const input = normalizeInput(rawInput);
  validateInput(input);
  const vaultKey = await getActiveVaultKey();
  await mutateCredentialRecords(async (records) => {
    const index = records.findIndex((item) => item.id === id);
    if (index < 0) throw new CredentialNotFoundError();
    const current = records[index];
    const site = normalizeWebsite(input.website);
    const encrypted = await encryptCredentialSecret({ username: input.username, password: input.password, notes: input.notes }, id, vaultKey);
    const updated: StoredCredential = {
      ...current,
      metadata: {
        ...current.metadata,
        serviceName: input.serviceName,
        website: site.website,
        hostname: site.hostname,
        updatedAt: nextUpdatedAt(current.metadata.updatedAt),
      },
      encrypted,
    };
    const next = [...records];
    next[index] = updated;
    return { records: next, result: undefined };
  });
}

export async function deleteCredential(id: string): Promise<void> {
  await getActiveVaultKey();
  await mutateCredentialRecords((records) => {
    if (!records.some((item) => item.id === id)) throw new CredentialNotFoundError();
    return { records: records.filter((item) => item.id !== id), result: undefined };
  });
}

export async function toggleCredentialFavorite(id: string): Promise<boolean> {
  await getActiveVaultKey();
  return mutateCredentialRecords((records) => {
    const index = records.findIndex((item) => item.id === id);
    if (index < 0) throw new CredentialNotFoundError();
    const next = [...records];
    const favorite = !records[index].metadata.favorite;
    next[index] = { ...records[index], metadata: { ...records[index].metadata, favorite } };
    return { records: next, result: favorite };
  });
}

export function searchCredentialSummaries(summaries: CredentialSummary[], query: string): CredentialSummary[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return summaries;
  return summaries.filter((item) =>
    item.serviceName.toLocaleLowerCase().includes(normalized) ||
    item.website.toLocaleLowerCase().includes(normalized) ||
    item.hostname.toLocaleLowerCase().includes(normalized) ||
    (!item.unreadable && item.username.toLocaleLowerCase().includes(normalized)),
  );
}
