import { getSession, updateSessionActivity } from "../security/session";
import { loadSettings } from "./settingsService";
import { lockVaultSession } from "./lockService";
import { AUTO_LOCK_ALARM } from "./runtimeConstants";

export async function cancelAutoLock(): Promise<void> {
  await chrome.alarms.clear(AUTO_LOCK_ALARM);
}

export async function scheduleAutoLock(): Promise<void> {
  const [session, settings] = await Promise.all([getSession(), loadSettings()]);
  if (!session || settings.autoLockMinutes === null) {
    await cancelAutoLock();
    return;
  }
  const deadline = Date.parse(session.lastActivityAt) + settings.autoLockMinutes * 60_000;
  if (deadline <= Date.now()) {
    await lockVaultSession("inactivity");
    return;
  }
  await chrome.alarms.create(AUTO_LOCK_ALARM, { when: deadline });
}

export async function recordActivity(): Promise<void> {
  const session = await updateSessionActivity();
  if (session) await scheduleAutoLock();
}

export async function getLastActivity(): Promise<string | null> {
  return (await getSession())?.lastActivityAt ?? null;
}

export async function handleAutoLockAlarm(): Promise<void> {
  const [session, settings] = await Promise.all([getSession(), loadSettings()]);
  if (!session || settings.autoLockMinutes === null) {
    await cancelAutoLock();
    return;
  }
  const elapsed = Date.now() - Date.parse(session.lastActivityAt);
  if (elapsed >= settings.autoLockMinutes * 60_000) await lockVaultSession("inactivity");
  else await scheduleAutoLock();
}
