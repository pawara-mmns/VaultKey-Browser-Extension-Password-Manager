import type { StoredCredentialCollection } from "./credential";
import type { VaultKeySettings } from "./settings";
import type { VaultConfig } from "./vault";

export interface VaultKeyBackupV1 {
  magic: "VAULTKEY_BACKUP";
  version: 1;
  kdf: { algorithm: "PBKDF2"; hash: "SHA-256"; iterations: number; salt: string };
  encryption: { algorithm: "AES-GCM"; iv: string; ciphertext: string };
  createdAt: string;
}

export interface VaultKeyBackupPayloadV1 {
  version: 1;
  vaultConfig: VaultConfig;
  credentials: StoredCredentialCollection;
  settings: VaultKeySettings;
}
