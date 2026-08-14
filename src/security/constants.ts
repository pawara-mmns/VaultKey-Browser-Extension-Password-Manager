export const VAULT_FORMAT_VERSION = 1 as const;
export const SESSION_FORMAT_VERSION = 1 as const;

export const KDF_ALGORITHM = "PBKDF2" as const;
export const KDF_HASH = "SHA-256" as const;
export const KDF_ITERATIONS = 600_000;
export const MIN_SUPPORTED_KDF_ITERATIONS = 100_000;
export const MAX_SUPPORTED_KDF_ITERATIONS = 10_000_000;
export const KDF_SALT_BYTES = 16;

export const WRAPPING_ALGORITHM = "AES-GCM" as const;
export const VAULT_KEY_BYTES = 32;
export const AES_GCM_IV_BYTES = 12;
export const WRAPPED_VAULT_KEY_AAD = "VaultKeyBrowser:WrappedVaultKey:v1";

export const MIN_MASTER_PASSWORD_LENGTH = 12;
