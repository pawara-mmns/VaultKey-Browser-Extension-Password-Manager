import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { PasswordVisibilityButton } from "../auth/PasswordVisibilityButton";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { Input } from "../components/Input";
import { evaluatePasswordStrength } from "../security/passwordStrength";
import { createEncryptedBackup, restoreUnlockedBackup, serializeBackup, unlockBackup } from "../services/backupService";
import { changeMasterPassword } from "../services/masterPasswordService";
import { resetLocalVault } from "../services/resetService";
import { VaultUnlockError } from "../types/vault";
import type { VaultKeyBackupPayloadV1 } from "../types/backup";

function SecurityDialog({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: ReactNode }) {
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const getFocusable = () => Array.from(panel?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? []).filter((element) => !element.hasAttribute("hidden"));
    const focusFrame = window.requestAnimationFrame(() => {
      if (!panel?.contains(document.activeElement)) getFocusable()[0]?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        panel?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div className="credential-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <button className="credential-modal__backdrop" type="button" aria-label="Close dialog" onClick={onClose} />
      <section ref={panelRef} className="credential-modal__panel settings-dialog" tabIndex={-1}>
        <button className="icon-button credential-modal__close" type="button" aria-label="Close" onClick={onClose}><Icon name="add" size={20} /></button>
        <div className="credential-modal__heading"><span className="eyebrow">Security management</span><h2 id={titleId}>{title}</h2><p id={descriptionId}>{description}</p></div>
        {children}
      </section>
    </div>
  );
}

function SecretInput({ id, label, value, onChange, autoFocus = false }: { id: string; label: string; value: string; onChange: (value: string) => void; autoFocus?: boolean }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  return <Input ref={ref} id={id} label={label} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoFocus={autoFocus} autoComplete="off" trailingAction={<PasswordVisibilityButton visible={visible} onToggle={() => { setVisible((current) => !current); ref.current?.focus(); }} />} />;
}

function DialogError({ children }: { children: ReactNode }) {
  return <p className="credential-error" role="alert">{children}</p>;
}

export function ChangeMasterPasswordDialog({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const strength = useMemo(() => evaluatePasswordStrength(next), [next]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      await changeMasterPassword(current, next, confirmation);
      setCurrent(""); setNext(""); setConfirmation("");
    } catch (caught) {
      setCurrent(""); setNext(""); setConfirmation("");
      setError(caught instanceof VaultUnlockError ? "The current master password is incorrect." : caught instanceof RangeError ? caught.message : "VaultKey could not change the master password. The existing password is still active.");
      setBusy(false);
    }
  };

  return <SecurityDialog title="Change Master Password" description="Re-wrap the existing random Vault Key with a new master password. Credentials are not re-encrypted." onClose={onClose}>
    <form className="credential-form" onSubmit={submit} autoComplete="off">
      <SecretInput id="current-master-password" label="Current master password" value={current} onChange={setCurrent} autoFocus />
      <SecretInput id="new-master-password" label="New master password" value={next} onChange={setNext} />
      <SecretInput id="confirm-new-master-password" label="Confirm new master password" value={confirmation} onChange={setConfirmation} />
      <div className={`strength-meter strength-meter--${strength.score}`} aria-label={`New password strength: ${strength.label}`}><div className="strength-meter__label"><span>Password strength</span><strong>{strength.label}</strong></div><div className="strength-meter__track">{[0,1,2,3,4].map((segment) => <span key={segment} className={next && segment <= strength.score ? "is-active" : ""} />)}</div></div>
      {error && <DialogError>{error}</DialogError>}
      <div className="credential-modal__actions"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy || !current || next.length < 12 || !confirmation}>{busy ? "Changing…" : "Change Master Password"}</Button></div>
    </form>
  </SecurityDialog>;
}

export function BackupDialog({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    try {
      const { container, filename } = await createEncryptedBackup(password);
      const url = URL.createObjectURL(new Blob([serializeBackup(container)], { type: "application/json" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setPassword(""); setDone(true);
    } catch (caught) {
      setPassword("");
      setError(caught instanceof VaultUnlockError ? "The master password is incorrect." : "VaultKey could not create an encrypted backup.");
    } finally { setBusy(false); }
  };
  return <SecurityDialog title="Create Encrypted Backup" description="The entire persistent vault is encrypted again so service names, websites, usernames, and other metadata are hidden." onClose={onClose}>
    <form className="credential-form" onSubmit={submit}><SecretInput id="backup-master-password" label="Current master password" value={password} onChange={setPassword} autoFocus />{error && <DialogError>{error}</DialogError>}{done && <p className="settings-success" role="status">Encrypted .vkbak backup created.</p>}<div className="credential-modal__actions"><Button variant="secondary" type="button" onClick={onClose}>Close</Button><Button type="submit" disabled={!password || busy}>{busy ? "Encrypting…" : "Create Backup"}</Button></div></form>
  </SecurityDialog>;
}

export function RestoreDialog({ serialized, fileName, onClose }: { serialized: string; fileName: string; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [payload, setPayload] = useState<VaultKeyBackupPayloadV1 | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const unlock = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try { setPayload(await unlockBackup(serialized, password)); setPassword(""); }
    catch { setPassword(""); setError("Unable to unlock this backup. The password may be incorrect or the backup file may be damaged."); }
    finally { setBusy(false); }
  };
  const restore = async () => {
    if (!payload || busy) return; setBusy(true); setError("");
    try { await restoreUnlockedBackup(payload); setPayload(null); }
    catch { setError("VaultKey could not restore the backup. Your current vault was preserved."); setBusy(false); }
  };
  return <SecurityDialog title="Restore Encrypted Backup" description={`Selected file: ${fileName}`} onClose={onClose}>
    {!payload ? <form className="credential-form" onSubmit={unlock}><SecretInput id="restore-backup-password" label="Backup master password" value={password} onChange={setPassword} autoFocus />{error && <DialogError>{error}</DialogError>}<div className="credential-modal__actions"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit" disabled={!password || busy}>{busy ? "Validating…" : "Unlock Backup"}</Button></div></form> : <div className="restore-confirmation"><Icon name="shield" size={24} /><h3>Restore this backup?</h3><p>Your current VaultKey vault will be replaced with the selected backup. This cannot be undone unless you already have another backup.</p>{error && <DialogError>{error}</DialogError>}<div><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" disabled={busy} onClick={() => void restore()}>{busy ? "Restoring…" : "Restore Vault"}</Button></div></div>}
  </SecurityDialog>;
}

export function ResetVaultDialog({ onClose }: { onClose: () => void }) {
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const reset = async () => { setBusy(true); setError(""); try { await resetLocalVault(confirmation); } catch { setError("VaultKey could not reset the local vault."); setBusy(false); } };
  return <SecurityDialog title="Reset VaultKey?" description="This permanently removes all locally stored credentials from this browser profile. Encrypted backup files are not deleted." onClose={onClose}><div className="credential-form"><Input id="reset-confirmation" label="Type RESET to continue" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" autoFocus />{error && <DialogError>{error}</DialogError>}<div className="credential-modal__actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" disabled={confirmation !== "RESET" || busy} onClick={() => void reset()}>{busy ? "Resetting…" : "Reset Local Vault"}</Button></div></div></SecurityDialog>;
}
