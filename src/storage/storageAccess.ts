async function restrictToTrustedContexts(area: chrome.storage.StorageArea): Promise<void> {
  if (typeof area.setAccessLevel === "function") {
    await area.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  }
}

export async function initializeStorageAccess(): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage) return;

  await Promise.allSettled([
    restrictToTrustedContexts(chrome.storage.local),
    restrictToTrustedContexts(chrome.storage.session),
  ]);
}
