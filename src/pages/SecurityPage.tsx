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
  { label: "Current website access", value: "Only when VaultKey is invoked", note: "Active tab", tone: "neutral" },
  { label: "Site matching", value: "Strict boundary-aware hostname matching", note: "Local only", tone: "success" },
  { label: "Autofill", value: "Not enabled", note: "Phase 06", tone: "neutral" },
  { label: "Automatic submit", value: "Disabled", note: "No page access", tone: "neutral" },
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
            <span className="eyebrow">Phase 05 status</span>
            <h2>Phishing-safe local site matching active</h2>
            <p>VaultKey identifies the active website only when invoked and suggests credentials using strict hostname boundaries.</p>
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
          <div><strong>Minimal browser permissions</strong><p>VaultKey uses active-tab access only when you invoke the extension to identify the current website. It cannot inspect page content or fill forms.</p></div>
        </section>
      </div>
    </div>
  );
}
