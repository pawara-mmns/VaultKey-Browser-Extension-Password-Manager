export interface PasswordGeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

export type PasswordStrengthLevel = "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";

export interface GeneratedPasswordMetrics {
  poolSize: number;
  entropyBits: number;
  strength: PasswordStrengthLevel;
}

export const MIN_GENERATED_PASSWORD_LENGTH = 8;
export const MAX_GENERATED_PASSWORD_LENGTH = 64;

export const DEFAULT_GENERATOR_OPTIONS: PasswordGeneratorOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
};

export const PASSWORD_CHARACTER_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
} as const;

export const AMBIGUOUS_CHARACTERS = "0Oo1lI";

const ambiguousCharacterSet = new Set(AMBIGUOUS_CHARACTERS);
const UINT32_RANGE = 0x1_0000_0000;

function filterAmbiguousCharacters(characters: string, excludeAmbiguous: boolean): string {
  if (!excludeAmbiguous) return characters;
  return Array.from(characters).filter((character) => !ambiguousCharacterSet.has(character)).join("");
}

function getEnabledCharacterSets(options: PasswordGeneratorOptions): string[] {
  const enabledSets: string[] = [];
  if (options.uppercase) enabledSets.push(filterAmbiguousCharacters(PASSWORD_CHARACTER_SETS.uppercase, options.excludeAmbiguous));
  if (options.lowercase) enabledSets.push(filterAmbiguousCharacters(PASSWORD_CHARACTER_SETS.lowercase, options.excludeAmbiguous));
  if (options.numbers) enabledSets.push(filterAmbiguousCharacters(PASSWORD_CHARACTER_SETS.numbers, options.excludeAmbiguous));
  if (options.symbols) enabledSets.push(filterAmbiguousCharacters(PASSWORD_CHARACTER_SETS.symbols, options.excludeAmbiguous));
  return enabledSets;
}

export function secureRandomInt(maxExclusive: number): number {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0 || maxExclusive > UINT32_RANGE) {
    throw new RangeError("Random index range is invalid.");
  }

  const rejectionLimit = Math.floor(UINT32_RANGE / maxExclusive) * maxExclusive;
  const randomValue = new Uint32Array(1);
  do {
    crypto.getRandomValues(randomValue);
  } while (randomValue[0] >= rejectionLimit);
  return randomValue[0] % maxExclusive;
}

function pickCharacter(characters: string): string {
  return characters[secureRandomInt(characters.length)];
}

function securelyShuffle(characters: string[]): void {
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = secureRandomInt(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }
}

function validateOptions(options: PasswordGeneratorOptions, enabledSetCount: number): void {
  if (!Number.isInteger(options.length) ||
      options.length < MIN_GENERATED_PASSWORD_LENGTH ||
      options.length > MAX_GENERATED_PASSWORD_LENGTH) {
    throw new RangeError(
      `Password length must be between ${MIN_GENERATED_PASSWORD_LENGTH} and ${MAX_GENERATED_PASSWORD_LENGTH}.`,
    );
  }
  if (enabledSetCount === 0) throw new RangeError("Select at least one character set.");
  if (options.length < enabledSetCount) throw new RangeError("Password length is too short for the selected character sets.");
}

export function generatePassword(options: PasswordGeneratorOptions): string {
  const enabledSets = getEnabledCharacterSets(options);
  validateOptions(options, enabledSets.length);

  const characterPool = enabledSets.join("");
  const passwordCharacters = enabledSets.map(pickCharacter);
  while (passwordCharacters.length < options.length) {
    passwordCharacters.push(pickCharacter(characterPool));
  }
  securelyShuffle(passwordCharacters);
  return passwordCharacters.join("");
}

export function getGeneratedPasswordMetrics(options: PasswordGeneratorOptions): GeneratedPasswordMetrics {
  const enabledSets = getEnabledCharacterSets(options);
  validateOptions(options, enabledSets.length);
  const poolSize = enabledSets.join("").length;
  const entropyBits = Math.floor(options.length * Math.log2(poolSize));

  let strength: PasswordStrengthLevel;
  if (entropyBits < 40) strength = "Very Weak";
  else if (entropyBits < 60) strength = "Weak";
  else if (entropyBits < 80) strength = "Fair";
  else if (entropyBits < 100) strength = "Strong";
  else strength = "Very Strong";

  return { poolSize, entropyBits, strength };
}
