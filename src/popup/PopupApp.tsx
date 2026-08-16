import { useState } from "react";
import { AuthGate } from "../auth/AuthGate";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icon";
import { Logo } from "../components/Logo";
import type { NavPage } from "../types";
import { QuickGenerator } from "./components/QuickGenerator";

function openVault(page: NavPage = "dashboard") {
  const relativeUrl = `vault.html#${page}`;
  if (typeof chrome !== "undefined" && chrome.runtime?.id) {
    void chrome.tabs.create({ url: chrome.runtime.getURL(relativeUrl) });
    return;
  }
  window.open(relativeUrl, "_blank", "noopener,noreferrer");
}

interface UnlockedPopupProps {
  onLock: () => Promise<void>;
}

function UnlockedPopup({ onLock }: UnlockedPopupProps) {
  const [activeView, setActiveView] = useState<"vault" | "generator">("vault");

  if (activeView === "generator") {
    return (
      <QuickGenerator
        onBack={() => setActiveView("vault")}
        onLock={onLock}
        onOpenFullGenerator={() => openVault("generator")}
      />
    );
  }

  return (
    <main className="popup-shell">
      <header className="popup-header">
        <Logo size="small" />
        <button className="lock-button" type="button" onClick={() => void onLock()}>
          <Icon name="lock" size={16} />
          <span>Lock</span>
        </button>
      </header>

      <div className="popup-content popup-content--unlocked">
        <section className="unlocked-hero" aria-labelledby="vault-unlocked-heading">
          <div className="unlocked-hero__icon"><Icon name="check" size={21} /></div>
          <div>
            <span className="eyebrow">Protected locally</span>
            <h1 id="vault-unlocked-heading">Vault unlocked</h1>
            <p>Your secure vault is ready.</p>
          </div>
        </section>

        <section className="popup-empty-card">
          <EmptyState
            compact
            title="No credentials yet"
            description="Encrypted credential storage will be added in a later phase."
          />
        </section>

        <section className="quick-actions" aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading">Tools</h2>
          <Button fullWidth variant="secondary" leadingIcon={<Icon name="generate" size={18} />} onClick={() => setActiveView("generator")}>
            Generate password
          </Button>
        </section>
      </div>

      <footer className="popup-footer">
        <Button fullWidth onClick={() => openVault()} trailingIcon={<Icon name="arrow" size={18} />}>
          Open full vault
        </Button>
      </footer>
    </main>
  );
}

export function PopupApp() {
  return (
    <AuthGate context="popup">
      {({ lock }) => <UnlockedPopup onLock={lock} />}
    </AuthGate>
  );
}
