import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";

const securityItems = [
  { label: "Vault status", value: "Unlocked", note: "Mock state", tone: "warning" },
  { label: "Storage", value: "Local only", note: "Not enabled", tone: "neutral" },
  { label: "Encryption", value: "Coming in Phase 02", note: "Not active", tone: "neutral" },
  { label: "Auto lock", value: "Coming later", note: "Not active", tone: "neutral" },
];

export function SecurityPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Protection"
        title="Security"
        description="A transparent view of what protects your vault now and what comes next."
      />
      <div className="security-layout">
        <section className="security-hero">
          <div className="security-hero__icon"><Icon name="shield" size={30} /></div>
          <div>
            <span className="eyebrow">Phase 01 status</span>
            <h2>UI demonstration mode</h2>
            <p>No credentials are stored and no encryption is currently active.</p>
          </div>
        </section>
        <section className="content-card security-list">
          {securityItems.map((item) => (
            <div className="security-row" key={item.label}>
              <div><strong>{item.label}</strong><span>{item.value}</span></div>
              <span className={`status-badge status-badge--${item.tone}`}>{item.note}</span>
            </div>
          ))}
        </section>
        <section className="permission-card">
          <Icon name="check" size={20} />
          <div><strong>Minimal browser permissions</strong><p>VaultKey requests no optional permissions in Phase 01.</p></div>
        </section>
      </div>
    </div>
  );
}
