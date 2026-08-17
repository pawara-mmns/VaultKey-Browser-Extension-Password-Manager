export interface VaultConfig {
  version: 1;
  kdf: {
    algorithm: "PBKDF2";
    hash: "SHA-256";
    iterations: number;
    salt: string;
  };
  wrappedVaultKey: {
    algorithm: "AES-GCM";
    iv: string;
    ciphertext: string;
  };
  createdAt: string;
}

export interface VaultSession {
  version: 1;
  unlocked: true;
  vaultKey: string;
  unlockedAt: string;
  lastActivityAt: string;
}

export type LockReason = "manual" | "inactivity" | "master-password-change" | "restore" | "reset";

export type VaultStatus = "NO_VAULT" | "LOCKED" | "UNLOCKED" | "ERROR";

export class VaultUnlockError extends Error {
  constructor() {
    super("Incorrect master password.");
    this.name = "VaultUnlockError";
  }
}

export class VaultConfigurationError extends Error {
  constructor() {
    super("VaultKey could not read your local vault.");
    this.name = "VaultConfigurationError";
  }
}

export class VaultAlreadyExistsError extends Error {
  constructor() {
    super("A local vault already exists.");
    this.name = "VaultAlreadyExistsError";
  }
}
