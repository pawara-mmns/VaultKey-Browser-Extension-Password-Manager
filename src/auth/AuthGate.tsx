import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { getVaultStatus, lockVault } from "../services/vaultService";
import { initializeStorageAccess } from "../storage/storageAccess";
import { STORAGE_KEYS } from "../storage/storageKeys";
import type { VaultStatus } from "../types/vault";
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
  const refreshSequence = useRef(0);

  const refreshStatus = useCallback(async () => {
    const sequence = ++refreshSequence.current;
    const nextStatus = await getVaultStatus();
    if (sequence === refreshSequence.current) setStatus(nextStatus);
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

  const handleLock = useCallback(async () => {
    refreshSequence.current += 1;
    await lockVault();
    setStatus("LOCKED");
  }, []);

  if (status === "LOADING") return <VaultLoadingView context={context} />;
  if (status === "NO_VAULT") return <CreateVaultView context={context} onCreated={markUnlocked} />;
  if (status === "LOCKED") return <UnlockVaultView context={context} onUnlocked={markUnlocked} />;
  if (status === "ERROR") return <VaultErrorView context={context} />;
  return <>{children({ lock: handleLock })}</>;
}
