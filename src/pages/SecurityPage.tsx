import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";

const securityItems = [
  { label: "Vault status", value: "Unlocked", note: "Active session", tone: "success" },
  { label: "Master protection", value: "PBKDF2-HMAC-SHA-256", note: "600,000 iterations", tone: "neutral" },
  { label: "Vault key protection", value: "AES-GCM", note: "Authenticated", tone: "neutral" },
  { label: "Password generator", value: "Cryptographically secure", note: "Active", tone: "success" },
  { label: "Random source", value: "Web Crypto", note: "Local only", tone: "neutral" },
  { label: "Generated password storage", value: "Not persisted", note: "Runtime memory only", tone: "neutral" },
  { label: "Storage", value: "Local only", note: "Browser sync disabled", tone: "neutral" },
  { label: "Credential encryption", value: "AES-GCM with per-record AAD", note: "Active", tone: "success" },
  { label: "Credential secret storage", value: "Username, password and notes encrypted", note: "Local only", tone: "success" },
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
            <span className="eyebrow">Phase 04 status</span>
            <h2>Encrypted credential vault active</h2>
            <p>Your random Vault Key protects every credential with AES-GCM and a fresh per-encryption IV.</p>
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
          <div><strong>Minimal browser permissions</strong><p>Only local extension storage is requested. Copy uses a direct user action; no sites or browsing data are accessible.</p></div>
        </section>
      </div>
    </div>
  );
}
