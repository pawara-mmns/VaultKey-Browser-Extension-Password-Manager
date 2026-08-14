import { MIN_MASTER_PASSWORD_LENGTH } from "../security/constants";

export interface CreateVaultValidation {
  passwordError: string | null;
  confirmationError: string | null;
  isValid: boolean;
}

export function validateCreateVaultInput(
  masterPassword: string,
  confirmation: string,
): CreateVaultValidation {
  const passwordError = masterPassword.length === 0
    ? "Enter a master password."
    : masterPassword.length < MIN_MASTER_PASSWORD_LENGTH
      ? `Use at least ${MIN_MASTER_PASSWORD_LENGTH} characters.`
      : null;
  const confirmationError = confirmation.length === 0
    ? "Confirm your master password."
    : masterPassword !== confirmation
      ? "Passwords do not match."
      : null;

  return { passwordError, confirmationError, isValid: !passwordError && !confirmationError };
}
