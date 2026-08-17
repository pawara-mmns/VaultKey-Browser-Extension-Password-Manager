import { useEffect, useRef, useState } from "react";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { deleteCredential, getCredential } from "../services/credentialService";
import type { DecryptedCredential } from "../types/credential";
import { writePasswordToClipboard } from "../services/clipboardService";

interface CredentialDetailsProps {
  credentialId: string;
  onClose: () => void;
  onEdit: (credential: DecryptedCredential) => void;
  onDeleted: () => void;
}

type CopyTarget = "username" | "password";

export function CredentialDetails({ credentialId, onClose, onEdit, onDeleted }: CredentialDetailsProps) {
  const [credential, setCredential] = useState<DecryptedCredential | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const copyTimer = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    void getCredential(credentialId).then((value) => {
      if (mounted) setCredential(value);
    }).catch(() => {
      if (mounted) setError("Unable to read this credential. The encrypted record may be damaged.");
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    };
  }, [credentialId]);

  const copyValue = async (target: CopyTarget, value: string) => {
    try {
      if (target === "password") await writePasswordToClipboard(value);
      else await navigator.clipboard.writeText(value);
      setCopied(target);
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setError(`Could not copy ${target}.`);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCredential(credentialId);
      setCredential(null);
      onDeleted();
    } catch {
      setError("VaultKey could not delete this credential.");
      setDeleting(false);
    }
  };

  if (loading) return <div className="credential-loading"><span className="auth-loading__spinner" /><p>Decrypting selected credential…</p></div>;
  if (error && !credential) return <div className="credential-read-error"><Icon name="shield" size={28} /><h2>Unable to read this credential</h2><p>The encrypted record may be damaged. Other credentials are still available.</p><Button variant="secondary" onClick={onClose}>Close</Button></div>;
  if (!credential) return null;

  return (
    <div className="credential-details">
      <div className="credential-modal__heading">
        <span className="eyebrow">Credential details</span>
        <h2>{credential.serviceName}</h2>
        <p>{credential.website || "No website saved"}</p>
      </div>
      <dl className="credential-detail-list">
        <div>
          <dt>Username</dt>
          <dd><span>{credential.username || "—"}</span><button type="button" onClick={() => void copyValue("username", credential.username)} disabled={!credential.username}><Icon name={copied === "username" ? "check" : "copy"} size={16} />{copied === "username" ? "Copied ✓" : "Copy"}</button></dd>
        </div>
        <div>
          <dt>Password</dt>
          <dd><span className="credential-detail__password">{showPassword ? credential.password : "••••••••••••••••"}</span><span className="credential-detail__actions"><button type="button" aria-label={showPassword ? "Hide password" : "Reveal password"} onClick={() => setShowPassword((value) => !value)}><Icon name={showPassword ? "eyeOff" : "eye"} size={16} /></button><button type="button" onClick={() => void copyValue("password", credential.password)}><Icon name={copied === "password" ? "check" : "copy"} size={16} />{copied === "password" ? "Copied ✓" : "Copy"}</button></span></dd>
        </div>
        <div><dt>Notes</dt><dd><span className="credential-detail__notes">{credential.notes || "No notes"}</span></dd></div>
        <div className="credential-detail__dates"><span><dt>Created</dt><dd>{new Date(credential.createdAt).toLocaleDateString()}</dd></span><span><dt>Updated</dt><dd>{new Date(credential.updatedAt).toLocaleDateString()}</dd></span></div>
      </dl>
      {error && <p className="credential-error" role="alert">{error}</p>}
      {confirmDelete ? (
        <div className="delete-confirmation">
          <strong>Delete {credential.serviceName}?</strong>
          <p>This credential will be permanently removed from your local VaultKey vault.</p>
          <div><Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button><Button variant="danger" disabled={deleting} onClick={() => void handleDelete()}>{deleting ? "Deleting…" : "Delete"}</Button></div>
        </div>
      ) : (
        <div className="credential-modal__actions credential-modal__actions--spread">
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>Delete credential</Button>
          <span><Button variant="secondary" onClick={onClose}>Close</Button><Button onClick={() => onEdit(credential)}>Edit credential</Button></span>
        </div>
      )}
    </div>
  );
}
