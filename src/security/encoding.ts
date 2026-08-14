const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}

export function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export function base64ToBytes(value: string): Uint8Array {
  if (!isValidBase64(value)) {
    throw new TypeError("Invalid Base64 data.");
  }

  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function isValidBase64(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length % 4 !== 0) return false;
  if (!BASE64_PATTERN.test(value)) return false;

  try {
    return btoa(atob(value)) === value;
  } catch {
    return false;
  }
}
