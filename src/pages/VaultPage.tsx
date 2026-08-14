import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icon";
import { Input } from "../components/Input";
import { PageHeader } from "../components/PageHeader";

export function VaultPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Credentials"
        title="My vault"
        description="Manage the credentials protected in your local vault."
        actions={<Button leadingIcon={<Icon name="add" size={18} />} disabled>Add password</Button>}
      />

      <section className="content-card vault-list-shell">
        <div className="vault-toolbar">
          <Input
            aria-label="Search passwords"
            leadingIcon={<Icon name="search" size={19} />}
            placeholder="Search passwords..."
            type="search"
            disabled
          />
          <Button variant="secondary" leadingIcon={<Icon name="filter" size={18} />} disabled>
            Filter
          </Button>
        </div>
        <div className="vault-list-heading">
          <span>All items</span>
          <span>0 credentials</span>
        </div>
        <EmptyState
          title="Your vault is ready"
          description="Encrypted credentials will appear here when secure storage arrives in Phase 02."
          action={<span className="phase-pill">Storage not enabled</span>}
        />
      </section>
    </div>
  );
}
