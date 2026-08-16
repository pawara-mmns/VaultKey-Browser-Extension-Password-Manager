export const CREDENTIAL_FORMAT_VERSION = 1 as const;
export const CREDENTIAL_COLLECTION_VERSION = 1 as const;

export interface CredentialMetadata {
  serviceName: string;
  website: string;
  hostname?: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CredentialSecret {
  username: string;
  password: string;
  notes: string;
}

export interface EncryptedFieldPayload {
  algorithm: "AES-GCM";
  iv: string;
  ciphertext: string;
}

export interface EncryptedCredentialPayload {
  username: EncryptedFieldPayload;
  secret: EncryptedFieldPayload;
}

export interface StoredCredential {
  id: string;
  version: typeof CREDENTIAL_FORMAT_VERSION;
  metadata: CredentialMetadata;
  encrypted: EncryptedCredentialPayload;
}

export interface StoredCredentialCollection {
  version: typeof CREDENTIAL_COLLECTION_VERSION;
  records: StoredCredential[];
}

export interface CredentialSummary extends Omit<CredentialMetadata, "hostname"> {
  id: string;
  hostname: string;
  username: string;
  unreadable: boolean;
}

export interface DecryptedCredential extends CredentialMetadata, CredentialSecret {
  id: string;
}

export interface CredentialSiteMetadata extends CredentialMetadata {
  id: string;
  hostname: string;
}

export interface CredentialInput {
  serviceName: string;
  username: string;
  password: string;
  website: string;
  notes: string;
}

export class VaultLockedError extends Error {
  constructor() {
    super("Unlock VaultKey to access credentials.");
    this.name = "VaultLockedError";
  }
}

export class CredentialNotFoundError extends Error {
  constructor() {
    super("This credential is no longer available.");
    this.name = "CredentialNotFoundError";
  }
}

export class CredentialDecryptionError extends Error {
  constructor() {
    super("Unable to read this credential. The encrypted record may be damaged.");
    this.name = "CredentialDecryptionError";
  }
}
