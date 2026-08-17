import { useRef, useState, type FormEvent } from "react";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { Input } from "../components/Input";
import { Logo } from "../components/Logo";
import { unlockVault } from "../services/vaultService";
import { VaultUnlockError } from "../types/vault";
import { PasswordVisibilityButton } from "./PasswordVisibilityButton";
import { resetLocalVault } from "../services/resetService";

interface UnlockVaultViewProps {
  context: "popup" | "vault";
  onUnlocked: () => void;
  notice?: string | null;
}

export function UnlockVaultView({ context, onUnlocked, notice = null }: UnlockVaultViewProps) {
  const [masterPassword, setMasterPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetting, setResetting] = useState(false);
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
          {notice && <p className="auth-form__notice" role="status">{notice}</p>}
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
        {showReset ? <div className="locked-reset"><strong>Reset local vault?</strong><p>This permanently removes all local credentials. Type RESET to continue.</p><Input id={`${context}-reset-confirmation`} aria-label="Reset confirmation" value={resetConfirmation} onChange={(event) => setResetConfirmation(event.target.value)} autoComplete="off" />{resetError && <p className="auth-form__error" role="alert">{resetError}</p>}<div><Button size="small" variant="secondary" onClick={() => { setShowReset(false); setResetConfirmation(""); }}>Cancel</Button><Button size="small" variant="danger" disabled={resetConfirmation !== "RESET" || resetting} onClick={() => { setResetting(true); setResetError(""); void resetLocalVault(resetConfirmation).catch(() => { setResetError("VaultKey could not reset the local vault."); setResetting(false); }); }}>{resetting ? "Resetting…" : "Reset Vault"}</Button></div></div> : <button className="locked-reset-link" type="button" onClick={() => setShowReset(true)}>Reset local vault</button>}
      </section>
      <p className="unlock-panel__footer">Your VaultKey vault is protected locally.</p>
    </main>
  );
}
