import { KDF_HASH } from "./constants";
import { bytesToArrayBuffer } from "./encoding";

export async function deriveMasterKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const passwordBytes = new TextEncoder().encode(password);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    bytesToArrayBuffer(passwordBytes),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: KDF_HASH,
      salt: bytesToArrayBuffer(salt),
      iterations,
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
