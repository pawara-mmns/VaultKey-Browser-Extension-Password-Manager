import { useState } from "react";
import { Button } from "../components/Button";
import { CredentialCard } from "../components/CredentialCard";
import { Icon } from "../components/Icon";
import { Input } from "../components/Input";
import { Logo } from "../components/Logo";
import { UnlockPanel } from "../components/UnlockPanel";
import type { NavPage } from "../types";
import { CURRENT_SITE_MOCK, MATCHING_CREDENTIALS_MOCK } from "../utils/helpers";

function openVault(page: NavPage = "dashboard") {
  const relativeUrl = `vault.html#${page}`;
  if (typeof chrome !== "undefined" && chrome.runtime?.id) {
    void chrome.tabs.create({ url: chrome.runtime.getURL(relativeUrl) });
    return;
  }
  window.open(relativeUrl, "_blank", "noopener,noreferrer");
}

export function PopupApp() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!isUnlocked) {
    return <UnlockPanel onUnlock={() => setIsUnlocked(true)} />;
  }

  const showPreviewNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2200);
  };

  return (
    <main className="popup-shell">
      <header className="popup-header">
        <Logo size="small" />
        <button className="lock-button" type="button" onClick={() => setIsUnlocked(false)}>
          <Icon name="lock" size={16} />
          <span>Lock</span>
        </button>
      </header>

      <div className="popup-content">
        <section className="site-section" aria-labelledby="current-site-heading">
          <span className="eyebrow" id="current-site-heading">Current website</span>
          <div className="site-row">
            <div className="site-row__icon"><Icon name="globe" size={19} /></div>
            <div><strong>{CURRENT_SITE_MOCK.hostname}</strong><span>1 matching login</span></div>
            <span className="demo-chip">Demo</span>
          </div>
        </section>

        <section className="match-section" aria-labelledby="matching-heading">
          <div className="popup-section-heading">
            <h2 id="matching-heading">Matching login</h2>
            <span>Mock data</span>
          </div>
          {MATCHING_CREDENTIALS_MOCK.map((credential) => (
            <CredentialCard
              key={credential.id}
              credential={credential}
              compact
              onFill={() => showPreviewNotice("Autofill is coming in a later phase.")}
            />
          ))}
        </section>

        <section className="search-section" aria-label="Search vault">
          <Input
            leadingIcon={<Icon name="search" size={18} />}
            placeholder="Search your vault..."
            aria-label="Search your vault"
            onChange={() => showPreviewNotice("Search is a UI preview in Phase 01.")}
          />
        </section>

        <section className="quick-actions" aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading">Quick actions</h2>
          <div className="quick-actions__grid">
            <Button variant="secondary" leadingIcon={<Icon name="add" size={18} />} onClick={() => openVault("vault")}>
              Add login
            </Button>
            <Button variant="secondary" leadingIcon={<Icon name="generate" size={18} />} onClick={() => openVault("generator")}>
              Generate
            </Button>
          </div>
        </section>
      </div>

      <footer className="popup-footer">
        <Button fullWidth onClick={() => openVault()} trailingIcon={<Icon name="arrow" size={18} />}>
          Open full vault
        </Button>
      </footer>

      {notice && <div className="toast" role="status"><Icon name="check" size={16} />{notice}</div>}
    </main>
  );
}
