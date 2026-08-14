import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";

const securityItems = [
  { label: "Vault status", value: "Unlocked", note: "Active session", tone: "success" },
  { label: "Master protection", value: "PBKDF2-HMAC-SHA-256", note: "600,000 iterations", tone: "neutral" },
  { label: "Vault key protection", value: "AES-GCM", note: "Authenticated", tone: "neutral" },
  { label: "Storage", value: "Local only", note: "Browser sync disabled", tone: "neutral" },
  { label: "Credential encryption", value: "Coming in Phase 04", note: "Not active", tone: "neutral" },
  { label: "Auto lock", value: "Coming later", note: "Not active", tone: "neutral" },
];

export function SecurityPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Protection"
        title="Vault security"
        description="A transparent view of the protection currently active for your local vault."
      />
      <div className="security-layout">
        <section className="security-hero">
          <div className="security-hero__icon"><Icon name="shield" size={30} /></div>
          <div>
            <span className="eyebrow">Phase 02 status</span>
            <h2>Local vault protection active</h2>
            <p>Your random vault key is protected by your master password. Credential storage is not enabled yet.</p>
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
          <div><strong>Minimal browser permissions</strong><p>Only local extension storage access is requested. No sites or browsing data are accessible.</p></div>
        </section>
      </div>
    </div>
  );
}
