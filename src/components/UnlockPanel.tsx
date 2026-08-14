import { useRef, useState, type FormEvent } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Input } from "./Input";
import { Logo } from "./Logo";

interface UnlockPanelProps {
  onUnlock: () => void;
  context?: "popup" | "vault";
}

export function UnlockPanel({ onUnlock, context = "popup" }: UnlockPanelProps) {
  const [masterPassword, setMasterPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMasterPassword("");
    onUnlock();
  };

  return (
    <main className={`unlock-panel unlock-panel--${context}`}>
      <div className="unlock-panel__brand"><Logo /></div>
      <section className="unlock-panel__card" aria-labelledby="unlock-title">
        <div className="unlock-panel__emblem" aria-hidden="true"><Icon name="lock" size={26} /></div>
        <div className="unlock-panel__heading">
          <span className="eyebrow">Private by design</span>
          <h1 id="unlock-title">Welcome back</h1>
          <p>Unlock your local vault to continue.</p>
        </div>
        <form onSubmit={handleSubmit} autoComplete="off">
          <Input
            ref={passwordRef}
            id={`${context}-master-password`}
            label="Master password"
            type={showPassword ? "text" : "password"}
            value={masterPassword}
            onChange={(event) => setMasterPassword(event.target.value)}
            placeholder="Enter any demo value"
            required
            autoFocus={context === "popup"}
            autoComplete="off"
            trailingAction={
              <button
                className="field__action"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => {
                  setShowPassword((visible) => !visible);
                  passwordRef.current?.focus();
                }}
              >
                <Icon name={showPassword ? "eyeOff" : "eye"} size={19} />
              </button>
            }
          />
          <Button type="submit" size="large" fullWidth trailingIcon={<Icon name="arrow" size={18} />}>
            Unlock Vault
          </Button>
        </form>
        <div className="unlock-panel__notice">
          <Icon name="shield" size={16} />
          <span>Phase 01 demo — this value is never saved.</span>
        </div>
      </section>
      <p className="unlock-panel__footer">Your passwords will stay on this device.</p>
    </main>
  );
}
