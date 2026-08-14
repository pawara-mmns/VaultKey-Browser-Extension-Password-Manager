import { Icon } from "../components/Icon";
import { Logo } from "../components/Logo";

interface VaultErrorViewProps {
  context: "popup" | "vault";
}

export function VaultErrorView({ context }: VaultErrorViewProps) {
  return (
    <main className={`unlock-panel unlock-panel--${context}`}>
      <div className="unlock-panel__brand"><Logo /></div>
      <section className="unlock-panel__card auth-error" role="alert">
        <div className="unlock-panel__emblem auth-error__emblem" aria-hidden="true">
          <Icon name="shield" size={26} />
        </div>
        <div className="unlock-panel__heading">
          <span className="eyebrow">Vault unavailable</span>
          <h1>We couldn't open your vault</h1>
          <p>VaultKey could not read your local vault. The stored vault configuration may be damaged.</p>
        </div>
        <div className="unlock-panel__notice">
          <Icon name="lock" size={16} />
          <span>Your existing data was not changed or deleted.</span>
        </div>
      </section>
      <p className="unlock-panel__footer">Reload the extension after checking its local storage.</p>
    </main>
  );
}
