import {
  CREDENTIAL_FORMAT_VERSION,
  CredentialDecryptionError,
  type CredentialSecret,
  type EncryptedCredentialPayload,
  type EncryptedFieldPayload,
} from "../types/credential";
import { AES_GCM_IV_BYTES, VAULT_KEY_BYTES, WRAPPING_ALGORITHM } from "./constants";
import { generateSecureRandomBytes } from "./crypto";
import { base64ToBytes, bytesToArrayBuffer, bytesToBase64 } from "./encoding";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });
type CredentialPayloadPurpose = "username" | "secret";

export function getCredentialAad(credentialId: string, purpose: CredentialPayloadPurpose): Uint8Array {
  return encoder.encode(`VaultKeyBrowser:Credential:v${CREDENTIAL_FORMAT_VERSION}:${credentialId}:${purpose}`);
}

async function importVaultKey(vaultKey: Uint8Array): Promise<CryptoKey> {
  if (vaultKey.byteLength !== VAULT_KEY_BYTES) throw new RangeError("Vault key has an invalid length.");
  return crypto.subtle.importKey("raw", bytesToArrayBuffer(vaultKey), WRAPPING_ALGORITHM, false, ["encrypt", "decrypt"]);
}

async function encryptPayload(plaintext: Uint8Array, credentialId: string, purpose: CredentialPayloadPurpose, key: CryptoKey): Promise<EncryptedFieldPayload> {
  const iv = generateSecureRandomBytes(AES_GCM_IV_BYTES);
  const ciphertext = await crypto.subtle.encrypt(
    { name: WRAPPING_ALGORITHM, iv: bytesToArrayBuffer(iv), additionalData: bytesToArrayBuffer(getCredentialAad(credentialId, purpose)) },
    key,
    bytesToArrayBuffer(plaintext),
  );
  return { algorithm: WRAPPING_ALGORITHM, iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ciphertext)) };
}

async function decryptPayload(encrypted: EncryptedFieldPayload, credentialId: string, purpose: CredentialPayloadPurpose, key: CryptoKey): Promise<string> {
  const plaintext = await crypto.subtle.decrypt(
    {
      name: WRAPPING_ALGORITHM,
      iv: bytesToArrayBuffer(base64ToBytes(encrypted.iv)),
      additionalData: bytesToArrayBuffer(getCredentialAad(credentialId, purpose)),
    },
    key,
    bytesToArrayBuffer(base64ToBytes(encrypted.ciphertext)),
  );
  return decoder.decode(plaintext);
}

export async function encryptCredentialSecret(secret: CredentialSecret, credentialId: string, vaultKey: Uint8Array): Promise<EncryptedCredentialPayload> {
  if (!credentialId) throw new TypeError("Credential ID is required.");
  if (typeof secret.username !== "string" || typeof secret.password !== "string" || typeof secret.notes !== "string") throw new TypeError("Credential secret is invalid.");
  const key = await importVaultKey(vaultKey);
  const [username, privateSecret] = await Promise.all([
    encryptPayload(encoder.encode(secret.username), credentialId, "username", key),
    encryptPayload(encoder.encode(JSON.stringify({ password: secret.password, notes: secret.notes })), credentialId, "secret", key),
  ]);
  return { username, secret: privateSecret };
}

export async function decryptCredentialUsername(encrypted: EncryptedCredentialPayload, credentialId: string, vaultKey: Uint8Array): Promise<string> {
  try {
    return await decryptPayload(encrypted.username, credentialId, "username", await importVaultKey(vaultKey));
  } catch {
    throw new CredentialDecryptionError();
  }
}

export async function decryptCredentialSecret(encrypted: EncryptedCredentialPayload, credentialId: string, vaultKey: Uint8Array): Promise<CredentialSecret> {
  try {
    const key = await importVaultKey(vaultKey);
    const [username, privateJson] = await Promise.all([
      decryptPayload(encrypted.username, credentialId, "username", key),
      decryptPayload(encrypted.secret, credentialId, "secret", key),
    ]);
    const parsed: unknown = JSON.parse(privateJson);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new TypeError("Invalid credential secret.");
    const values = parsed as Record<string, unknown>;
    if (typeof values.password !== "string" || typeof values.notes !== "string") throw new TypeError("Invalid credential secret.");
    return { username, password: values.password, notes: values.notes };
  } catch {
    throw new CredentialDecryptionError();
  }
}
