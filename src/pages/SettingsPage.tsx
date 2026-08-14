import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";

const sections = [
  { icon: "sparkle" as const, title: "Appearance", setting: "Theme", value: "VaultKey Dark", state: "Active" },
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
        description="Shape how VaultKey looks and behaves. Persistence is not enabled yet."
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
      <div className="about-row"><span>VaultKey Browser</span><span>Phase 01 · v0.1.0</span></div>
    </div>
  );
}
