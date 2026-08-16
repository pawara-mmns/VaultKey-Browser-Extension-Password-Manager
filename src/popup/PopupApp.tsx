import { useState } from "react";
import { AuthGate } from "../auth/AuthGate";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icon";
import { Input } from "../components/Input";
import { Logo } from "../components/Logo";
import { CredentialProvider, useCredentials } from "../credentials/CredentialProvider";
import { useDebouncedValue } from "../credentials/useDebouncedValue";
import { searchCredentialSummaries } from "../services/credentialService";
import type { NavPage } from "../types";
import { PopupCredentialList } from "./components/PopupCredentialList";
import { QuickGenerator } from "./components/QuickGenerator";

function openVault(page: NavPage | "vault-add" | `credential-${string}` = "dashboard") {
  const relativeUrl = `vault.html#${page}`;
  if (typeof chrome !== "undefined" && chrome.runtime?.id) { void chrome.tabs.create({ url: chrome.runtime.getURL(relativeUrl) }); return; }
  window.open(relativeUrl, "_blank", "noopener,noreferrer");
}

function UnlockedPopup({ onLock }: { onLock: () => Promise<void> }) {
  const [activeView, setActiveView] = useState<"vault" | "generator">("vault");
  const [query, setQuery] = useState("");
  const { credentials, loading } = useCredentials();
  const filtered = searchCredentialSummaries(credentials, useDebouncedValue(query)).slice(0, 5);

  if (activeView === "generator") return <QuickGenerator onBack={() => setActiveView("vault")} onLock={onLock} onOpenFullGenerator={() => openVault("generator")} />;

  return (
    <main className="popup-shell">
      <header className="popup-header"><Logo size="small" /><button className="lock-button" type="button" onClick={() => void onLock()}><Icon name="lock" size={16} /><span>Lock</span></button></header>
      <div className="popup-content popup-content--unlocked">
        <section className="popup-vault-heading"><span className="eyebrow">Protected locally</span><h1>Your vault</h1><p>{credentials.length} encrypted {credentials.length === 1 ? "credential" : "credentials"}</p></section>
        <section className="search-section"><Input aria-label="Search vault" type="search" placeholder="Search vault..." leadingIcon={<Icon name="search" size={17} />} value={query} onChange={(event) => setQuery(event.target.value)} /></section>
        <section className="popup-credentials-section">
          <div className="popup-section-heading"><h2>{query ? "Search results" : "Recent credentials"}</h2><span>Up to 5</span></div>
          {loading ? <div className="popup-loading">Loading encrypted vault…</div> : credentials.length === 0 ? <div className="popup-empty-card"><EmptyState compact title="No credentials yet" description="Add your first encrypted credential." /></div> : filtered.length === 0 ? <div className="popup-empty-card"><EmptyState compact title="No credentials found" description="Try another search." /></div> : <PopupCredentialList credentials={filtered} onOpen={(id) => openVault(`credential-${id}`)} />}
        </section>
        <section className="quick-actions"><h2>Quick actions</h2><div className="quick-actions__grid"><Button variant="secondary" leadingIcon={<Icon name="add" size={17} />} onClick={() => openVault("vault-add")}>Add</Button><Button variant="secondary" leadingIcon={<Icon name="generate" size={17} />} onClick={() => setActiveView("generator")}>Generate</Button></div></section>
      </div>
      <footer className="popup-footer"><Button fullWidth onClick={() => openVault()} trailingIcon={<Icon name="arrow" size={18} />}>Open full vault</Button></footer>
    </main>
  );
}

export function PopupApp() {
  return <AuthGate context="popup">{({ lock }) => <CredentialProvider><UnlockedPopup onLock={lock} /></CredentialProvider>}</AuthGate>;
}
