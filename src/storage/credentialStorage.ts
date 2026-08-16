import { AES_GCM_IV_BYTES } from "../security/constants";
import { base64ToBytes, isValidBase64 } from "../security/encoding";
import {
  CREDENTIAL_COLLECTION_VERSION,
  CREDENTIAL_FORMAT_VERSION,
  type StoredCredential,
} from "../types/credential";
import { STORAGE_KEYS } from "./storageKeys";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

export function isValidStoredCredential(value: unknown): value is StoredCredential {
  if (!isRecord(value) || value.version !== CREDENTIAL_FORMAT_VERSION || typeof value.id !== "string" || !value.id) return false;
  if (!isRecord(value.metadata) || !isRecord(value.encrypted) || !isRecord(value.encrypted.username) || !isRecord(value.encrypted.secret)) return false;
  const metadata = value.metadata;
  const encryptedUsername = value.encrypted.username;
  const encryptedSecret = value.encrypted.secret;
  if (
    typeof metadata.serviceName !== "string" || !metadata.serviceName.trim() ||
    typeof metadata.website !== "string" || (metadata.hostname !== undefined && typeof metadata.hostname !== "string") ||
    typeof metadata.favorite !== "boolean" || !isTimestamp(metadata.createdAt) || !isTimestamp(metadata.updatedAt) ||
    encryptedUsername.algorithm !== "AES-GCM" || !isValidBase64(encryptedUsername.iv) || !isValidBase64(encryptedUsername.ciphertext) ||
    encryptedSecret.algorithm !== "AES-GCM" || !isValidBase64(encryptedSecret.iv) || !isValidBase64(encryptedSecret.ciphertext)
  ) return false;
  try {
    return base64ToBytes(encryptedUsername.iv).byteLength === AES_GCM_IV_BYTES && base64ToBytes(encryptedUsername.ciphertext).byteLength >= 16 &&
      base64ToBytes(encryptedSecret.iv).byteLength === AES_GCM_IV_BYTES && base64ToBytes(encryptedSecret.ciphertext).byteLength > 16;
  } catch {
    return false;
  }
}

export interface CredentialStorageResult {
  records: StoredCredential[];
  invalidRecordCount: number;
}

interface RawCredentialCollection {
  records: StoredCredential[];
  invalidRecords: unknown[];
  malformedCollection: boolean;
}

async function loadRawCredentialCollection(): Promise<RawCredentialCollection> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.credentials);
  const stored: unknown = result[STORAGE_KEYS.credentials];
  if (stored === undefined) return { records: [], invalidRecords: [], malformedCollection: false };
  if (!isRecord(stored) || stored.version !== CREDENTIAL_COLLECTION_VERSION || !Array.isArray(stored.records)) {
    return { records: [], invalidRecords: [], malformedCollection: true };
  }
  return {
    records: stored.records.filter(isValidStoredCredential),
    invalidRecords: stored.records.filter((record) => !isValidStoredCredential(record)),
    malformedCollection: false,
  };
}

export async function loadCredentialRecords(): Promise<CredentialStorageResult> {
  const collection = await loadRawCredentialCollection();
  return { records: collection.records, invalidRecordCount: collection.malformedCollection ? 1 : collection.invalidRecords.length };
}

async function saveCredentialRecords(records: StoredCredential[], preservedInvalidRecords: unknown[]): Promise<void> {
  if (!records.every(isValidStoredCredential)) throw new TypeError("Credential collection contains an invalid record.");
  const collection = { version: CREDENTIAL_COLLECTION_VERSION, records: [...records, ...preservedInvalidRecords] };
  await chrome.storage.local.set({ [STORAGE_KEYS.credentials]: collection });
}

let mutationQueue: Promise<void> = Promise.resolve();

export function mutateCredentialRecords<T>(
  mutation: (records: StoredCredential[]) => Promise<{ records: StoredCredential[]; result: T }> | { records: StoredCredential[]; result: T },
): Promise<T> {
  const operation = async () => {
    const collection = await loadRawCredentialCollection();
    if (collection.malformedCollection) throw new TypeError("Credential collection is malformed.");
    const outcome = await mutation(collection.records);
    await saveCredentialRecords(outcome.records, collection.invalidRecords);
    return outcome.result;
  };
  const next = mutationQueue.then(operation, operation);
  mutationQueue = next.then(() => undefined, () => undefined);
  return next;
}
