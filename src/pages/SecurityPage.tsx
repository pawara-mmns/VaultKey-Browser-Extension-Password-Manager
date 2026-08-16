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
  { label: "Quick Fill", value: "Explicit matching-account action", note: "On demand", tone: "success" },
  { label: "Form access", value: "One main-frame injection after revalidation", note: "No static scripts", tone: "neutral" },
  { label: "Persistent website access", value: "Disabled", note: "No host permissions", tone: "success" },
  { label: "Automatic submit", value: "Disabled", note: "Always manual", tone: "success" },
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
            <span className="eyebrow">Phase 06 status</span>
            <h2>Controlled, user-initiated Quick Fill active</h2>
            <p>VaultKey revalidates the active website before decrypting one selected credential, fills a conservative login form, and never submits it.</p>
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
          <div><strong>Minimal browser permissions</strong><p>VaultKey uses storage, activeTab, and scripting. Page access occurs only after you click Fill Login for a matching account; no host permissions or static content scripts are used.</p></div>
        </section>
      </div>
    </div>
  );
}
