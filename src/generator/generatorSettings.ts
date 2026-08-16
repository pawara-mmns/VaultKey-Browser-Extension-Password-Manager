import {
  DEFAULT_GENERATOR_OPTIONS,
  MAX_GENERATED_PASSWORD_LENGTH,
  MIN_GENERATED_PASSWORD_LENGTH,
  type PasswordGeneratorOptions,
} from "../security/passwordGenerator";
import { STORAGE_KEYS } from "../storage/storageKeys";

interface StoredGeneratorSettings extends PasswordGeneratorOptions {
  version: 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidGeneratorSettings(value: unknown): value is PasswordGeneratorOptions {
  if (!isRecord(value)) return false;
  const hasCharacterSet = value.uppercase === true || value.lowercase === true || value.numbers === true || value.symbols === true;
  return Number.isInteger(value.length) &&
    (value.length as number) >= MIN_GENERATED_PASSWORD_LENGTH &&
    (value.length as number) <= MAX_GENERATED_PASSWORD_LENGTH &&
    typeof value.uppercase === "boolean" &&
    typeof value.lowercase === "boolean" &&
    typeof value.numbers === "boolean" &&
    typeof value.symbols === "boolean" &&
    typeof value.excludeAmbiguous === "boolean" &&
    hasCharacterSet;
}

export function parseStoredGeneratorSettings(value: unknown): PasswordGeneratorOptions | null {
  if (!isRecord(value) || value.version !== 1 || !isValidGeneratorSettings(value)) return null;
  return {
    length: value.length,
    uppercase: value.uppercase,
    lowercase: value.lowercase,
    numbers: value.numbers,
    symbols: value.symbols,
    excludeAmbiguous: value.excludeAmbiguous,
  };
}

export async function getGeneratorSettings(): Promise<PasswordGeneratorOptions> {
  const result = await chrome.storage.session.get(STORAGE_KEYS.generatorSettings);
  return parseStoredGeneratorSettings(result[STORAGE_KEYS.generatorSettings]) ?? { ...DEFAULT_GENERATOR_OPTIONS };
}

export async function saveGeneratorSettings(settings: PasswordGeneratorOptions): Promise<void> {
  if (!isValidGeneratorSettings(settings)) throw new RangeError("Generator settings are invalid.");
  const storedSettings: StoredGeneratorSettings = { version: 1, ...settings };
  await chrome.storage.session.set({ [STORAGE_KEYS.generatorSettings]: storedSettings });
}

export function areGeneratorSettingsEqual(
  first: PasswordGeneratorOptions,
  second: PasswordGeneratorOptions,
): boolean {
  return first.length === second.length &&
    first.uppercase === second.uppercase &&
    first.lowercase === second.lowercase &&
    first.numbers === second.numbers &&
    first.symbols === second.symbols &&
    first.excludeAmbiguous === second.excludeAmbiguous;
}
