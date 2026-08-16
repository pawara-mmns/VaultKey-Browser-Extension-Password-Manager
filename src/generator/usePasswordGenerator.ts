import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_GENERATOR_OPTIONS,
  generatePassword,
  getGeneratedPasswordMetrics,
  type PasswordGeneratorOptions,
} from "../security/passwordGenerator";
import { STORAGE_KEYS } from "../storage/storageKeys";
import {
  areGeneratorSettingsEqual,
  getGeneratorSettings,
  parseStoredGeneratorSettings,
  saveGeneratorSettings,
} from "./generatorSettings";

export function usePasswordGenerator() {
  const [settings, setSettings] = useState<PasswordGeneratorOptions>({ ...DEFAULT_GENERATOR_OPTIONS });
  const [password, setPassword] = useState(() => generatePassword(DEFAULT_GENERATOR_OPTIONS));
  const settingsRef = useRef(settings);

  const applySettings = useCallback((nextSettings: PasswordGeneratorOptions) => {
    settingsRef.current = nextSettings;
    setSettings(nextSettings);
    setPassword(generatePassword(nextSettings));
  }, []);

  useEffect(() => {
    let mounted = true;
    void getGeneratorSettings().then((storedSettings) => {
      if (mounted && !areGeneratorSettingsEqual(settingsRef.current, storedSettings)) applySettings(storedSettings);
    });

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: chrome.storage.AreaName,
    ) => {
      if (areaName !== "session" || !(STORAGE_KEYS.generatorSettings in changes)) return;
      const nextSettings = parseStoredGeneratorSettings(changes[STORAGE_KEYS.generatorSettings].newValue);
      if (nextSettings && !areGeneratorSettingsEqual(settingsRef.current, nextSettings)) applySettings(nextSettings);
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      mounted = false;
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [applySettings]);

  const updateSettings = useCallback((nextSettings: PasswordGeneratorOptions) => {
    applySettings(nextSettings);
    void saveGeneratorSettings(nextSettings).catch(() => undefined);
  }, [applySettings]);

  const regenerate = useCallback(() => {
    setPassword(generatePassword(settingsRef.current));
  }, []);

  const metrics = useMemo(() => getGeneratedPasswordMetrics(settings), [settings]);
  return { settings, password, metrics, updateSettings, regenerate };
}
