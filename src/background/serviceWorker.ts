import { initializeStorageAccess } from "../storage/storageAccess";
import { handleAutoLockAlarm, scheduleAutoLock } from "../services/activityService";
import { handleClipboardClearAlarm, restoreClipboardAlarm } from "../services/clipboardService";
import { AUTO_LOCK_ALARM, CLIPBOARD_CLEAR_ALARM } from "../services/runtimeConstants";

// Keep initialization lightweight; unlocked key material lives in storage.session, not worker memory.
void initializeStorageAccess();
void scheduleAutoLock();
void restoreClipboardAlarm();

chrome.runtime.onInstalled.addListener(() => {
  void initializeStorageAccess();
  void scheduleAutoLock();
  void restoreClipboardAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  void initializeStorageAccess();
  void scheduleAutoLock();
  void restoreClipboardAlarm();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === AUTO_LOCK_ALARM) void handleAutoLockAlarm();
  if (alarm.name === CLIPBOARD_CLEAR_ALARM) void handleClipboardClearAlarm();
});
