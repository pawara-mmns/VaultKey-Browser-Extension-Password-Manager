import { useState } from "react";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { Input } from "../components/Input";
import { getGeneratorSettings } from "../generator/generatorSettings";
import { generatePassword } from "../security/passwordGenerator";
import { createCredential, updateCredential } from "../services/credentialService";
import type { CredentialInput, DecryptedCredential } from "../types/credential";

interface CredentialFormProps {
  credential?: DecryptedCredential;
  initialPassword?: string;
  onCancel: () => void;
  onSaved: () => void;
}

const emptyInput: CredentialInput = { serviceName: "", username: "", password: "", website: "", notes: "" };

export function CredentialForm({ credential, initialPassword = "", onCancel, onSaved }: CredentialFormProps) {
  const [form, setForm] = useState<CredentialInput>(() => credential ? {
    serviceName: credential.serviceName,
    username: credential.username,
    password: credential.password,
    website: credential.website,
    notes: credential.notes,
  } : { ...emptyInput, password: initialPassword });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ serviceName?: string; password?: string }>({});
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  const update = (key: keyof CredentialInput, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === "serviceName" || key === "password") setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleGenerate = async () => {
    try {
      const settings = await getGeneratorSettings();
      update("password", generatePassword(settings));
    } catch {
      setStatus("error");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      serviceName: form.serviceName.trim() ? undefined : "Service name is required.",
      password: form.password ? undefined : "Password is required.",
    };
    setErrors(nextErrors);
    if (nextErrors.serviceName || nextErrors.password) return;
    setStatus("saving");
    try {
      if (credential) await updateCredential(credential.id, form);
      else await createCredential(form);
      setForm(emptyInput);
      onSaved();
    } catch {
      setStatus("error");
    }
  };

  return (
    <form className="credential-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="credential-modal__heading">
        <span className="eyebrow">Encrypted credential</span>
        <h2>{credential ? "Edit credential" : "Add password"}</h2>
        <p>Sensitive fields are encrypted locally with your active Vault Key.</p>
      </div>
      <Input label="Service Name" value={form.serviceName} onChange={(event) => update("serviceName", event.target.value)} aria-invalid={Boolean(errors.serviceName)} hint={errors.serviceName} autoFocus />
      <Input label="Username / Email" value={form.username} onChange={(event) => update("username", event.target.value)} autoComplete="off" />
      <Input
        label="Password"
        type={showPassword ? "text" : "password"}
        value={form.password}
        onChange={(event) => update("password", event.target.value)}
        aria-invalid={Boolean(errors.password)}
        hint={errors.password}
        autoComplete="new-password"
        trailingAction={
          <span className="credential-form__password-actions">
            <button className="field__action" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}><Icon name={showPassword ? "eyeOff" : "eye"} size={17} /></button>
            <button className="field__action" type="button" aria-label="Generate password" onClick={() => void handleGenerate()}><Icon name="generate" size={17} /></button>
          </span>
        }
      />
      <Input label="Website" value={form.website} onChange={(event) => update("website", event.target.value)} placeholder="github.com" />
      <label className="credential-textarea-field">
        <span>Notes</span>
        <textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} rows={4} />
      </label>
      {status === "error" && <p className="credential-error" role="alert">VaultKey could not save this credential. Confirm the vault is unlocked and try again.</p>}
      <div className="credential-modal__actions">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={status === "saving"}>{status === "saving" ? "Encrypting…" : "Save password"}</Button>
      </div>
    </form>
  );
}
