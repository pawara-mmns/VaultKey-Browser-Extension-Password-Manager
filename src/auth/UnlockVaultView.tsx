import { useRef, useState, type FormEvent } from "react";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { Input } from "../components/Input";
import { Logo } from "../components/Logo";
import { unlockVault } from "../services/vaultService";
import { VaultUnlockError } from "../types/vault";
import { PasswordVisibilityButton } from "./PasswordVisibilityButton";

interface UnlockVaultViewProps {
  context: "popup" | "vault";
  onUnlocked: () => void;
}

export function UnlockVaultView({ context, onUnlocked }: UnlockVaultViewProps) {
  const [masterPassword, setMasterPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!masterPassword || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await unlockVault(masterPassword);
      setMasterPassword("");
      onUnlocked();
    } catch (caughtError) {
      setMasterPassword("");
      setError(caughtError instanceof VaultUnlockError
        ? caughtError.message
        : "VaultKey could not unlock your vault. Please try again.");
      window.setTimeout(() => passwordRef.current?.focus(), 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={`unlock-panel unlock-panel--${context}`}>
      <div className="unlock-panel__brand"><Logo /></div>
      <section className="unlock-panel__card" aria-labelledby={`${context}-unlock-title`}>
        <div className="unlock-panel__emblem" aria-hidden="true"><Icon name="lock" size={26} /></div>
        <div className="unlock-panel__heading">
          <span className="eyebrow">Private by design</span>
          <h1 id={`${context}-unlock-title`}>Welcome back</h1>
          <p>Unlock your local vault to continue.</p>
        </div>
        <form onSubmit={handleSubmit} autoComplete="off">
          <Input
            ref={passwordRef}
            id={`${context}-master-password`}
            label="Master password"
            type={showPassword ? "text" : "password"}
            value={masterPassword}
            onChange={(event) => {
              setMasterPassword(event.target.value);
              if (error) setError(null);
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${context}-unlock-error` : undefined}
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
          {error && <p className="auth-form__error" id={`${context}-unlock-error`} role="alert">{error}</p>}
          <Button
            type="submit"
            size="large"
            fullWidth
            disabled={!masterPassword || isSubmitting}
            trailingIcon={!isSubmitting ? <Icon name="arrow" size={18} /> : undefined}
          >
            {isSubmitting ? "Unlocking..." : "Unlock Vault"}
          </Button>
        </form>
        <div className="unlock-panel__notice">
          <Icon name="shield" size={16} />
          <span>Your master password is never stored.</span>
        </div>
      </section>
      <p className="unlock-panel__footer">Your VaultKey vault is protected locally.</p>
    </main>
  );
}
