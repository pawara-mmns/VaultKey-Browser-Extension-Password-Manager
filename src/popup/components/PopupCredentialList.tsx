import { useRef, useState } from "react";
import { Button } from "../../components/Button";
import { CredentialItem } from "../../credentials/CredentialItem";
import { getCredential } from "../../services/credentialService";
import type { CredentialSummary } from "../../types/credential";

export function PopupCredentialList({ credentials, onOpen }: { credentials: CredentialSummary[]; onOpen: (id: string) => void }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const copyPassword = async (id: string) => {
    try {
      const credential = await getCredential(id);
      await navigator.clipboard.writeText(credential.password);
      setCopiedId(id);
      setErrorId(null);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setErrorId(id);
    }
  };
  return <div className="popup-credential-list">{credentials.map((credential) => <div key={credential.id}><CredentialItem credential={credential} compact onOpen={() => onOpen(credential.id)} action={<Button variant="secondary" size="small" disabled={credential.unreadable} onClick={() => void copyPassword(credential.id)}>{copiedId === credential.id ? "Copied ✓" : "Copy"}</Button>} />{errorId === credential.id && <p role="alert">Could not copy password.</p>}</div>)}</div>;
}
