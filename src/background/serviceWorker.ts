import { initializeStorageAccess } from "../storage/storageAccess";
import { clearSession } from "../security/session";

// Keep initialization lightweight; unlocked key material lives in storage.session, not worker memory.
void initializeStorageAccess();

chrome.runtime.onInstalled.addListener(() => {
  void initializeStorageAccess();
  void clearSession();
});
