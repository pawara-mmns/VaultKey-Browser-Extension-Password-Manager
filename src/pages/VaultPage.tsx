import { useState } from "react";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icon";
import { Input } from "../components/Input";
import { PageHeader } from "../components/PageHeader";
import { CredentialList } from "../credentials/CredentialList";
import { useCredentials } from "../credentials/CredentialProvider";
import { useDebouncedValue } from "../credentials/useDebouncedValue";
import { searchCredentialSummaries } from "../services/credentialService";

interface VaultPageProps { onAdd: () => void; onOpen: (id: string) => void; }

export function VaultPage({ onAdd, onOpen }: VaultPageProps) {
  const { credentials, loading, error, invalidRecordCount, toggleFavorite } = useCredentials();
  const [query, setQuery] = useState("");
  const visibleCredentials = searchCredentialSummaries(credentials, useDebouncedValue(query));
  return (
    <div className="page">
      <PageHeader eyebrow="Credentials" title="My vault" description="Manage the credentials protected in your local vault." actions={<Button leadingIcon={<Icon name="add" size={18} />} onClick={onAdd}>Add password</Button>} />
      <section className="content-card vault-list-shell">
        <div className="vault-toolbar">
          <Input aria-label="Search credentials" leadingIcon={<Icon name="search" size={19} />} placeholder="Search credentials..." type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button variant="secondary" leadingIcon={<Icon name="star" size={18} />} disabled>Favorites in sidebar</Button>
        </div>
        <div className="vault-list-heading"><span>All items</span><span>{visibleCredentials.length} {visibleCredentials.length === 1 ? "credential" : "credentials"}</span></div>
        {loading ? <div className="credential-loading"><span className="auth-loading__spinner" /><p>Loading encrypted credentials…</p></div> : (
          <>
            {error && <p className="credential-banner credential-banner--error">{error}</p>}
            {invalidRecordCount > 0 && <p className="credential-banner">{invalidRecordCount} damaged record {invalidRecordCount === 1 ? "was" : "were"} skipped.</p>}
            {credentials.length === 0 ? <EmptyState title="Your vault is ready" description="Add your first credential to start using VaultKey." action={<Button leadingIcon={<Icon name="add" size={17} />} onClick={onAdd}>Add password</Button>} /> : <CredentialList credentials={visibleCredentials} emptyTitle="No credentials found" emptyDescription="Try another service, username or website." onOpen={onOpen} onToggleFavorite={(id) => void toggleFavorite(id)} />}
          </>
        )}
      </section>
    </div>
  );
}
