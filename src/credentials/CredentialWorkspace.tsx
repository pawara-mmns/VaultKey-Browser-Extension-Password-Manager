import { Icon } from "../components/Icon";
import type { DecryptedCredential } from "../types/credential";
import { useCredentials } from "./CredentialProvider";
import { CredentialDetails } from "./CredentialDetails";
import { CredentialForm } from "./CredentialForm";

export type CredentialWorkspaceState =
  | { kind: "closed" }
  | { kind: "add"; initialPassword?: string; initialWebsite?: string }
  | { kind: "details"; credentialId: string }
  | { kind: "edit"; credential: DecryptedCredential };

interface CredentialWorkspaceProps {
  state: CredentialWorkspaceState;
  onChange: (state: CredentialWorkspaceState) => void;
}

export function CredentialWorkspace({ state, onChange }: CredentialWorkspaceProps) {
  const { refresh } = useCredentials();
  if (state.kind === "closed") return null;

  const close = () => onChange({ kind: "closed" });
  const saved = async () => {
    await refresh();
    close();
  };
  return (
    <div className="credential-modal" role="dialog" aria-modal="true" aria-label={state.kind === "add" ? "Add credential" : "Credential"}>
      <button className="credential-modal__backdrop" type="button" aria-label="Close credential panel" onClick={close} />
      <section className="credential-modal__panel">
        <button className="icon-button credential-modal__close" type="button" aria-label="Close" onClick={close}><Icon name="add" size={20} /></button>
        {state.kind === "add" && <CredentialForm initialPassword={state.initialPassword} initialWebsite={state.initialWebsite} onCancel={close} onSaved={() => void saved()} />}
        {state.kind === "edit" && <CredentialForm credential={state.credential} onCancel={() => onChange({ kind: "details", credentialId: state.credential.id })} onSaved={() => void saved()} />}
        {state.kind === "details" && <CredentialDetails credentialId={state.credentialId} onClose={close} onEdit={(credential) => onChange({ kind: "edit", credential })} onDeleted={() => void saved()} />}
      </section>
    </div>
  );
}
