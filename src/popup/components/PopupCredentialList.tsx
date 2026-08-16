import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/Button";
import { CredentialItem } from "../../credentials/CredentialItem";
import { getCredential } from "../../services/credentialService";
import type { CredentialSummary } from "../../types/credential";

type CopyKind = "username" | "password";

interface PopupCredentialListProps {
  credentials: CredentialSummary[];
  onOpen: (id: string) => void;
  showUsernameCopy?: boolean;
}
export function PopupCredentialList({ credentials, onOpen, showUsernameCopy = false }: PopupCredentialListProps) {
  const [copied, setCopied] = useState<{ id: string; kind: CopyKind } | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  const markCopied = (id: string, kind: CopyKind) => {
    setCopied({ id, kind });
    setErrorId(null);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1500);
  };

  const copyUsername = async (credential: CredentialSummary) => {
    try {
      await navigator.clipboard.writeText(credential.username);
      markCopied(credential.id, "username");
    } catch {
      setErrorId(credential.id);
    }
  };

  const copyPassword = async (id: string) => {
    try {
      const credential = await getCredential(id);
      await navigator.clipboard.writeText(credential.password);
      markCopied(id, "password");
    } catch {
      setErrorId(id);
    }
  };

  return (
    <div className="popup-credential-list">
      {credentials.map((credential) => (
        <div key={credential.id}>
          <CredentialItem
            credential={credential}
            compact
            onOpen={() => onOpen(credential.id)}
            action={
              <div className="popup-credential-actions">
                {showUsernameCopy && <Button variant="ghost" size="small" disabled={credential.unreadable || !credential.username} onClick={() => void copyUsername(credential)}>{copied?.id === credential.id && copied.kind === "username" ? "User ✓" : "User"}</Button>}
                <Button variant="secondary" size="small" disabled={credential.unreadable} onClick={() => void copyPassword(credential.id)}>{copied?.id === credential.id && copied.kind === "password" ? "Copied ✓" : "Password"}</Button>
                <Button variant="ghost" size="small" onClick={() => onOpen(credential.id)}>Open</Button>
              </div>
            }
          />
          {errorId === credential.id && <p role="alert">Could not copy this credential.</p>}
        </div>
      ))}
    </div>
  );
}
