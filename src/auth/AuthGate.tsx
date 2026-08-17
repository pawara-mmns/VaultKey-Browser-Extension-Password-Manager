import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { getVaultStatus, lockVault } from "../services/vaultService";
import { initializeStorageAccess } from "../storage/storageAccess";
import { STORAGE_KEYS } from "../storage/storageKeys";
import type { VaultStatus } from "../types/vault";
import { recordActivity, scheduleAutoLock } from "../services/activityService";
import { CreateVaultView } from "./CreateVaultView";
import { VaultErrorView } from "./VaultErrorView";
import { VaultLoadingView } from "./VaultLoadingView";
import { UnlockVaultView } from "./UnlockVaultView";

export interface AuthControls {
  lock: () => Promise<void>;
}

interface AuthGateProps {
  context: "popup" | "vault";
  children: (controls: AuthControls) => ReactNode;
}

export function AuthGate({ context, children }: AuthGateProps) {
  const [status, setStatus] = useState<VaultStatus | "LOADING">("LOADING");
  const [notice, setNotice] = useState<string | null>(null);
  const refreshSequence = useRef(0);

  const refreshStatus = useCallback(async () => {
    const sequence = ++refreshSequence.current;
    const nextStatus = await getVaultStatus();
    if (sequence === refreshSequence.current) {
      let nextNotice: string | null = null;
      if (nextStatus === "LOCKED") {
        const result = await chrome.storage.session.get(STORAGE_KEYS.authNotice);
        const storedNotice = result[STORAGE_KEYS.authNotice];
        nextNotice = typeof storedNotice === "string" ? storedNotice : null;
        if (nextNotice) await chrome.storage.session.remove(STORAGE_KEYS.authNotice);
      }
      if (sequence !== refreshSequence.current) return;
      setNotice(nextNotice);
      setStatus(nextStatus);
    }
  }, []);

  const markUnlocked = useCallback(() => {
    refreshSequence.current += 1;
    setStatus("UNLOCKED");
  }, []);

  useEffect(() => {
    let mounted = true;
    void initializeStorageAccess().then(async () => {
      if (!mounted) return;
      await refreshStatus();
    });

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: chrome.storage.AreaName,
    ) => {
      const relevantLocalChange = areaName === "local" && STORAGE_KEYS.vaultConfig in changes;
      const relevantSessionChange = areaName === "session" && STORAGE_KEYS.vaultSession in changes;
      if (relevantLocalChange || relevantSessionChange) void refreshStatus();
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      mounted = false;
      refreshSequence.current += 1;
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [refreshStatus]);

  useEffect(() => {
    if (status !== "UNLOCKED") return;
    void scheduleAutoLock();
    let lastRecorded = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastRecorded < 15_000) return;
      lastRecorded = now;
      void recordActivity();
    };
    window.addEventListener("pointerdown", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("input", handleActivity);
    return () => {
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("input", handleActivity);
    };
  }, [status]);

  const handleLock = useCallback(async () => {
    refreshSequence.current += 1;
    await lockVault();
    setStatus("LOCKED");
  }, []);

  if (status === "LOADING") return <VaultLoadingView context={context} />;
  if (status === "NO_VAULT") return <CreateVaultView context={context} onCreated={markUnlocked} />;
  if (status === "LOCKED") return <UnlockVaultView context={context} onUnlocked={markUnlocked} notice={notice} />;
  if (status === "ERROR") return <VaultErrorView context={context} />;
  return <>{children({ lock: handleLock })}</>;
}
