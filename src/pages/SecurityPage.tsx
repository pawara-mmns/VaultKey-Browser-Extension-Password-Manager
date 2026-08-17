import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { hasClipboardProtectionPermission } from "../services/clipboardService";
import { getDefaultSettings, loadSettings } from "../services/settingsService";
import type { VaultKeySettings } from "../types/settings";

function getSecurityItems(settings: VaultKeySettings, clipboardPermission: boolean) { return [
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
  { label: "Auto lock", value: settings.autoLockMinutes === null ? "Never" : `${settings.autoLockMinutes} minutes`, note: settings.autoLockMinutes === null ? "Disabled" : "Activity based", tone: settings.autoLockMinutes === null ? "neutral" : "success" },
  { label: "Clipboard protection", value: settings.clipboardClearSeconds === null || !clipboardPermission ? "Disabled" : `${settings.clipboardClearSeconds} seconds`, note: clipboardPermission ? "Optional access granted" : "Optional access not granted", tone: settings.clipboardClearSeconds !== null && clipboardPermission ? "success" : "neutral" },
  { label: "Encrypted backup", value: "Metadata-hiding AES-GCM container", note: "Local file", tone: "success" },
  { label: "Cloud sync", value: "Disabled", note: "Offline only", tone: "success" },
]; }

export function SecurityPage() {
  const [settings, setSettings] = useState(getDefaultSettings);
  const [clipboardPermission, setClipboardPermission] = useState(false);
  useEffect(() => { void Promise.all([loadSettings(), hasClipboardProtectionPermission()]).then(([next, permission]) => { setSettings(next); setClipboardPermission(permission); }); }, []);
  const securityItems = getSecurityItems(settings, clipboardPermission);
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
            <span className="eyebrow">Phase 07 status</span>
            <h2>Local security management active</h2>
            <p>Timestamp-based Auto Lock, optional clear-if-unchanged clipboard protection, Vault Key re-wrapping, and encrypted local backups now protect the vault lifecycle.</p>
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
          <div><strong>Minimal browser permissions</strong><p>Required permissions are storage, activeTab, scripting, alarms, and offscreen. Clipboard read/write access remains optional and is requested only after explicit enablement. No host permissions or static content scripts are used.</p></div>
        </section>
      </div>
    </div>
  );
}
