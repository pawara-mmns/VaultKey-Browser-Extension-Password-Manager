import { useMemo, useRef, useState, type FormEvent } from "react";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { Input } from "../components/Input";
import { Logo } from "../components/Logo";
import { evaluatePasswordStrength } from "../security/passwordStrength";
import { createVault } from "../services/vaultService";
import { PasswordVisibilityButton } from "./PasswordVisibilityButton";
import { validateCreateVaultInput } from "./validation";

interface CreateVaultViewProps {
  context: "popup" | "vault";
  onCreated: () => void;
}

export function CreateVaultView({ context, onCreated }: CreateVaultViewProps) {
  const [masterPassword, setMasterPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);
  const strength = useMemo(() => evaluatePasswordStrength(masterPassword), [masterPassword]);

  const { passwordError, confirmationError, isValid } = validateCreateVaultInput(masterPassword, confirmation);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setFormError(null);
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createVault(masterPassword);
      setMasterPassword("");
      setConfirmation("");
      onCreated();
    } catch {
      setFormError("VaultKey could not create your vault. Your existing local data was not overwritten.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={`unlock-panel unlock-panel--${context} create-vault-view`}>
      <div className="unlock-panel__brand"><Logo /></div>
      <section className="unlock-panel__card" aria-labelledby={`${context}-create-title`}>
        <div className="create-vault-view__heading">
          <span className="eyebrow">Private by design</span>
          <h1 id={`${context}-create-title`}>Create your vault</h1>
          <p>One master password protects your local VaultKey vault.</p>
        </div>
        <form onSubmit={handleSubmit} autoComplete="off">
          <Input
            ref={passwordRef}
            id={`${context}-create-password`}
            label="Master password"
            type={showPassword ? "text" : "password"}
            value={masterPassword}
            onChange={(event) => setMasterPassword(event.target.value)}
            hint="Minimum 12 characters; passphrases are welcome."
            aria-invalid={submitted && Boolean(passwordError)}
            aria-describedby={submitted && passwordError ? `${context}-password-error` : undefined}
            disabled={isSubmitting}
            autoFocus={context === "popup"}
            autoComplete="off"
            trailingAction={
              <PasswordVisibilityButton
                visible={showPassword}
                onToggle={() => {
                  setShowPassword((visible) => !visible);
                  passwordRef.current?.focus();
                }}
              />
            }
          />
          {submitted && passwordError && <p className="auth-form__error" id={`${context}-password-error`}>{passwordError}</p>}

          <Input
            ref={confirmationRef}
            id={`${context}-confirm-password`}
            label="Confirm master password"
            type={showConfirmation ? "text" : "password"}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            aria-invalid={submitted && Boolean(confirmationError)}
            aria-describedby={submitted && confirmationError ? `${context}-confirmation-error` : undefined}
            disabled={isSubmitting}
            autoComplete="off"
            trailingAction={
              <PasswordVisibilityButton
                visible={showConfirmation}
                onToggle={() => {
                  setShowConfirmation((visible) => !visible);
                  confirmationRef.current?.focus();
                }}
              />
            }
          />
          {submitted && confirmationError && <p className="auth-form__error" id={`${context}-confirmation-error`}>{confirmationError}</p>}

          <div className={`strength-meter strength-meter--${strength.score}`} aria-label={`Password strength: ${strength.label}`}>
            <div className="strength-meter__label"><span>Password strength</span><strong>{strength.label}</strong></div>
            <div className="strength-meter__track" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((segment) => (
                <span key={segment} className={masterPassword && segment <= strength.score ? "is-active" : ""} />
              ))}
            </div>
          </div>

          {formError && <p className="auth-form__error" role="alert">{formError}</p>}
          <Button type="submit" size="large" fullWidth disabled={!isValid || isSubmitting}>
            {isSubmitting ? "Creating secure vault..." : "Create Vault"}
          </Button>
        </form>
        <div className="recovery-warning">
          <Icon name="shield" size={17} />
          <p><strong>Your master password cannot be recovered.</strong><span>If you lose it, VaultKey cannot unlock your vault.</span></p>
        </div>
      </section>
      <p className="unlock-panel__footer">Your data stays on this device.</p>
    </main>
  );
}
