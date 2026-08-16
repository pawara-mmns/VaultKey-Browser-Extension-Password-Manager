import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { CredentialList } from "../credentials/CredentialList";
import { useCredentials } from "../credentials/CredentialProvider";
import type { NavPage } from "../types";
import { getGreeting } from "../utils/helpers";

interface DashboardPageProps { onNavigate: (page: NavPage) => void; onAdd: () => void; onOpen: (id: string) => void; }

export function DashboardPage({ onNavigate, onAdd, onOpen }: DashboardPageProps) {
  const { credentials, loading } = useCredentials();
  const stats = [
    { label: "Total passwords", value: loading ? "—" : String(credentials.length), icon: "key" as const },
    { label: "Favorites", value: loading ? "—" : String(credentials.filter((item) => item.favorite).length), icon: "star" as const },
    { label: "Unreadable", value: loading ? "—" : String(credentials.filter((item) => item.unreadable).length), icon: "shield" as const },
  ];
  const recent = credentials.slice(0, 5);
  return (
    <div className="page page--dashboard">
      <PageHeader eyebrow="Overview" title={getGreeting()} description="Your encrypted credentials stay local to this browser profile." actions={<Button leadingIcon={<Icon name="add" size={18} />} onClick={onAdd}>Add password</Button>} />
      <section className="stats-grid" aria-label="Vault statistics">{stats.map((stat) => <article className="stat-card" key={stat.label}><div className="stat-card__icon"><Icon name={stat.icon} size={20} /></div><span>{stat.label}</span><strong>{stat.value}</strong><small>Current vault</small></article>)}</section>
      <section className="content-card recent-section">
        <div className="section-heading"><div><span className="eyebrow">Activity</span><h2>Recent credentials</h2></div><Button variant="ghost" size="small" onClick={() => onNavigate("vault")}>View vault</Button></div>
        {loading ? <div className="credential-loading credential-loading--compact"><span className="auth-loading__spinner" /><p>Loading activity…</p></div> : recent.length === 0 ? <EmptyState compact title="Your vault is ready" description="Add your first credential to start using VaultKey." action={<Button onClick={onAdd}>Add password</Button>} /> : <CredentialList compact credentials={recent} emptyTitle="No credentials" emptyDescription="" onOpen={onOpen} />}
      </section>
    </div>
  );
}
