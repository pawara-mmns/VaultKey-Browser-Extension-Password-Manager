import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";

const sections = [
  { icon: "sparkle" as const, title: "Appearance", setting: "Theme", value: "VaultKey Dark", state: "Active" },
  { icon: "generate" as const, title: "Password generator", setting: "Secure local generation", value: "Web Crypto", state: "Active" },
  { icon: "lock" as const, title: "Security", setting: "Auto lock", value: "Coming later", state: "Planned" },
  { icon: "copy" as const, title: "Clipboard", setting: "Auto clear", value: "Coming later", state: "Planned" },
  { icon: "vault" as const, title: "Data", setting: "Encrypted export", value: "Coming later", state: "Planned" },
];

export function SettingsPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Review active local features and preferences planned for later phases."
      />
      <section className="settings-stack">
        {sections.map((section) => (
          <article className="settings-card" key={section.title}>
            <div className="settings-card__icon"><Icon name={section.icon} size={20} /></div>
            <div className="settings-card__copy"><h2>{section.title}</h2><p>{section.setting}</p></div>
            <div className="settings-card__value"><strong>{section.value}</strong><span>{section.state}</span></div>
          </article>
        ))}
      </section>
      <div className="about-row"><span>VaultKey Browser</span><span>Phase 03 · v0.3.0</span></div>
    </div>
  );
}
