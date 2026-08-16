import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { listCredentialSummaries, toggleCredentialFavorite } from "../services/credentialService";
import { STORAGE_KEYS } from "../storage/storageKeys";
import type { CredentialSummary } from "../types/credential";

interface CredentialContextValue {
  credentials: CredentialSummary[];
  loading: boolean;
  error: string;
  invalidRecordCount: number;
  refresh: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

const CredentialContext = createContext<CredentialContextValue | null>(null);

export function CredentialProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<CredentialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invalidRecordCount, setInvalidRecordCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const result = await listCredentialSummaries();
      setCredentials(result.summaries);
      setInvalidRecordCount(result.invalidRecordCount);
      setError("");
    } catch {
      setError("VaultKey could not load your credentials.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const handleStorageChange = (changes: Record<string, chrome.storage.StorageChange>, areaName: chrome.storage.AreaName) => {
      if (areaName === "local" && STORAGE_KEYS.credentials in changes) void refresh();
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [refresh]);

  const toggleFavorite = useCallback(async (id: string) => {
    try {
      await toggleCredentialFavorite(id);
      await refresh();
    } catch {
      setError("VaultKey could not update this favorite.");
    }
  }, [refresh]);

  const value = useMemo(() => ({ credentials, loading, error, invalidRecordCount, refresh, toggleFavorite }),
    [credentials, loading, error, invalidRecordCount, refresh, toggleFavorite]);
  return <CredentialContext.Provider value={value}>{children}</CredentialContext.Provider>;
}

export function useCredentials(): CredentialContextValue {
  const context = useContext(CredentialContext);
  if (!context) throw new Error("useCredentials must be used inside CredentialProvider.");
  return context;
}

