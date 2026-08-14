import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import type { NavPage } from "../types";
import { getGreeting } from "../utils/helpers";

interface DashboardPageProps {
  onNavigate: (page: NavPage) => void;
}

const stats = [
  { label: "Total passwords", value: "0", icon: "key" as const },
  { label: "Favorites", value: "0", icon: "star" as const },
  { label: "Weak passwords", value: "0", icon: "shield" as const },
];

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  return (
    <div className="page page--dashboard">
      <PageHeader
        eyebrow="Overview"
        title={getGreeting()}
        description="Your private space for passwords, built to stay on this device."
        actions={
          <Button leadingIcon={<Icon name="add" size={18} />} onClick={() => onNavigate("vault")}>
            Add password
          </Button>
        }
      />

      <section className="stats-grid" aria-label="Vault statistics">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <div className="stat-card__icon"><Icon name={stat.icon} size={20} /></div>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>Phase 01</small>
          </article>
        ))}
      </section>

      <section className="content-card recent-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Activity</span>
            <h2>Recent credentials</h2>
          </div>
          <Button variant="ghost" size="small" onClick={() => onNavigate("vault")}>View vault</Button>
        </div>
        <EmptyState
          compact
          title="No credentials yet"
          description="Add your first password when secure storage is enabled in a later phase."
        />
      </section>
    </div>
  );
}
