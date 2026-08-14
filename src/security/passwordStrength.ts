export type PasswordStrengthLabel = "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: PasswordStrengthLabel;
}

const labels: PasswordStrengthLabel[] = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
const obviousSequences = ["012345", "123456", "abcdef", "qwerty", "password", "letmein", "vaultkey"];

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: labels[0] };

  let points = 0;
  if (password.length >= 12) points += 2;
  if (password.length >= 16) points += 1;
  if (password.length >= 24) points += 1;

  const variety = [/[a-z]/u, /[A-Z]/u, /\p{N}/u, /[^\p{L}\p{N}\s]/u, /\s/u]
    .filter((pattern) => pattern.test(password)).length;
  points += Math.max(0, variety - 1);

  const normalized = password.toLocaleLowerCase();
  if (obviousSequences.some((sequence) => normalized.includes(sequence))) points -= 2;
  if (/(.)\1{3,}/u.test(password)) points -= 2;

  const uniqueRatio = new Set(Array.from(password)).size / Array.from(password).length;
  if (uniqueRatio < 0.35) points -= 2;

  let score: PasswordStrength["score"];
  if (password.length < 8 || points <= 1) score = 0;
  else if (password.length < 12 || points <= 3) score = 1;
  else if (points <= 5) score = 2;
  else if (points <= 7) score = 3;
  else score = 4;

  return { score, label: labels[score] };
}
