import { bytesToBase64 } from "../security/encoding";

async function digestText(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64(new Uint8Array(digest));
}

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (typeof message !== "object" || message === null || (message as { type?: unknown }).type !== "vaultkey.clipboard.clear-if-matches") return false;
  const expectedDigest = (message as { expectedDigest?: unknown }).expectedDigest;
  if (typeof expectedDigest !== "string") {
    sendResponse({ cleared: false });
    return false;
  }
  void (async () => {
    try {
      const currentText = await navigator.clipboard.readText();
      if ((await digestText(currentText)) !== expectedDigest) return { cleared: false };
      await navigator.clipboard.writeText("");
      return { cleared: true };
    } catch {
      return { cleared: false };
    }
  })().then(sendResponse);
  return true;
});
