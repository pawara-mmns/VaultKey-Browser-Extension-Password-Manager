import { describe, expect, it } from "vitest";
import {
  AMBIGUOUS_CHARACTERS,
  DEFAULT_GENERATOR_OPTIONS,
  generatePassword,
  getGeneratedPasswordMetrics,
  MAX_GENERATED_PASSWORD_LENGTH,
  MIN_GENERATED_PASSWORD_LENGTH,
  PASSWORD_CHARACTER_SETS,
  secureRandomInt,
  type PasswordGeneratorOptions,
} from "./passwordGenerator";

function options(overrides: Partial<PasswordGeneratorOptions> = {}): PasswordGeneratorOptions {
  return { ...DEFAULT_GENERATOR_OPTIONS, ...overrides };
}

describe("secure password generator", () => {
  it("returns secure random integers inside the max-exclusive range", () => {
    const values = Array.from({ length: 100 }, () => secureRandomInt(7));
    expect(values.every((value) => value >= 0 && value < 7)).toBe(true);
    expect(secureRandomInt(1)).toBe(0);
    expect(() => secureRandomInt(0)).toThrow(RangeError);
    expect(() => secureRandomInt(-1)).toThrow(RangeError);
  });

  it("generates exact minimum, default, and maximum lengths", () => {
    expect(generatePassword(options({ length: MIN_GENERATED_PASSWORD_LENGTH })).length).toBe(8);
    expect(generatePassword(options()).length).toBe(20);
    expect(generatePassword(options({ length: MAX_GENERATED_PASSWORD_LENGTH })).length).toBe(64);
  });

  it.each([
    ["uppercase", PASSWORD_CHARACTER_SETS.uppercase],
    ["lowercase", PASSWORD_CHARACTER_SETS.lowercase],
    ["numbers", PASSWORD_CHARACTER_SETS.numbers],
    ["symbols", PASSWORD_CHARACTER_SETS.symbols],
  ] as const)("generates %s-only passwords", (enabledOption, allowedCharacters) => {
    const selectedOptions = options({ uppercase: false, lowercase: false, numbers: false, symbols: false, [enabledOption]: true });
    const password = generatePassword(selectedOptions);
    expect(Array.from(password).every((character) => allowedCharacters.includes(character))).toBe(true);
  });

  it("guarantees at least one character from every enabled set", () => {
    const password = generatePassword(options());
    expect(Array.from(PASSWORD_CHARACTER_SETS.uppercase).some((character) => password.includes(character))).toBe(true);
    expect(Array.from(PASSWORD_CHARACTER_SETS.lowercase).some((character) => password.includes(character))).toBe(true);
    expect(Array.from(PASSWORD_CHARACTER_SETS.numbers).some((character) => password.includes(character))).toBe(true);
    expect(Array.from(PASSWORD_CHARACTER_SETS.symbols).some((character) => password.includes(character))).toBe(true);
  });

  it("excludes centralized ambiguous characters when requested", () => {
    for (let run = 0; run < 20; run += 1) {
      const password = generatePassword(options({ length: 64, excludeAmbiguous: true }));
      expect(Array.from(AMBIGUOUS_CHARACTERS).every((character) => !password.includes(character))).toBe(true);
    }
  });

  it("safely rejects invalid lengths and an empty character pool", () => {
    expect(() => generatePassword(options({ length: 7 }))).toThrow(RangeError);
    expect(() => generatePassword(options({ length: 65 }))).toThrow(RangeError);
    expect(() => generatePassword(options({ uppercase: false, lowercase: false, numbers: false, symbols: false })))
      .toThrow("Select at least one character set.");
  });

  it("normally produces different consecutive outputs without printing them", () => {
    const firstPassword = generatePassword(options());
    const secondPassword = generatePassword(options());
    expect(firstPassword === secondPassword).toBe(false);
  });

  it("calculates finite entropy that increases with length and pool size", () => {
    const shortMetrics = getGeneratedPasswordMetrics(options({ length: 8, uppercase: false, numbers: false, symbols: false }));
    const longerMetrics = getGeneratedPasswordMetrics(options({ length: 32, uppercase: false, numbers: false, symbols: false }));
    const largerPoolMetrics = getGeneratedPasswordMetrics(options({ length: 8 }));

    expect(Number.isFinite(shortMetrics.entropyBits)).toBe(true);
    expect(shortMetrics.entropyBits).toBeGreaterThan(0);
    expect(longerMetrics.entropyBits).toBeGreaterThan(shortMetrics.entropyBits);
    expect(largerPoolMetrics.entropyBits).toBeGreaterThan(shortMetrics.entropyBits);
    expect(getGeneratedPasswordMetrics(options()).strength).toBe("Very Strong");
  });
});
