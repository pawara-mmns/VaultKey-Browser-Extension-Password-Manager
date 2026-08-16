import { useEffect, useMemo, useState } from "react";
import { AuthGate } from "../auth/AuthGate";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icon";
import { Input } from "../components/Input";
import { Logo } from "../components/Logo";
import { CredentialProvider, useCredentials } from "../credentials/CredentialProvider";
import { useDebouncedValue } from "../credentials/useDebouncedValue";
import { savePendingCredentialPrefill } from "../services/credentialPrefillService";
import { getCurrentSite } from "../services/currentTabService";
import { searchCredentialSummaries } from "../services/credentialService";
import { fillCredential, interpretFillResult } from "../services/fillService";
import { findMatchingCredentials } from "../services/siteMatchingService";
import type { CurrentSite } from "../types/currentSite";
import type { NavPage } from "../types";
import { CurrentSiteCard } from "./components/CurrentSiteCard";
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
  const [currentSite, setCurrentSite] = useState<CurrentSite | null>(null);
  const [siteLoading, setSiteLoading] = useState(true);
  const [fillingId, setFillingId] = useState<string | null>(null);
  const [fillFeedback, setFillFeedback] = useState<{ id: string; message: string; success: boolean } | null>(null);
  const { credentials, loading } = useCredentials();
  const debouncedQuery = useDebouncedValue(query);
  const filtered = searchCredentialSummaries(credentials, debouncedQuery).slice(0, 5);
  const matches = useMemo(() => currentSite?.supported ? findMatchingCredentials(currentSite.hostname, credentials) : [], [currentSite, credentials]);

  useEffect(() => {
    let mounted = true;
    void getCurrentSite().then((site) => { if (mounted) setCurrentSite(site); }).finally(() => { if (mounted) setSiteLoading(false); });
    return () => { mounted = false; };
  }, []);

  const addCurrentSite = async () => {
    if (currentSite?.supported) {
      try { await savePendingCredentialPrefill(currentSite.url); } catch { /* The form can still open without a prefill. */ }
    }
    openVault("vault-add");
  };

  const fillLogin = async (id: string) => {
    if (fillingId) return;
    setFillingId(id);
    setFillFeedback(null);
    try {
      const result = await fillCredential(id);
      setFillFeedback({ id, message: interpretFillResult(result), success: result.success });
    } catch {
      setFillFeedback({ id, message: "VaultKey could not complete Quick Fill.", success: false });
    } finally {
      setFillingId(null);
    }
  };

  if (activeView === "generator") return <QuickGenerator onBack={() => setActiveView("vault")} onLock={onLock} onOpenFullGenerator={() => openVault("generator")} />;

  return (
    <main className="popup-shell">
      <header className="popup-header"><Logo size="small" /><button className="lock-button" type="button" onClick={() => void onLock()}><Icon name="lock" size={16} /><span>Lock</span></button></header>
      <div className="popup-content popup-content--unlocked">
        <CurrentSiteCard currentSite={currentSite} loading={siteLoading} matches={matches} matchesLoading={loading} onAddLogin={() => void addCurrentSite()} onOpen={(id) => openVault(`credential-${id}`)} onFill={(id) => void fillLogin(id)} fillingId={fillingId} fillFeedback={fillFeedback} />
        <section className="search-section"><Input aria-label="Search vault" type="search" placeholder="Search credentials..." leadingIcon={<Icon name="search" size={17} />} value={query} onChange={(event) => setQuery(event.target.value)} /></section>
        {query && <section className="popup-credentials-section"><div className="popup-section-heading"><h2>Search results</h2><span>Up to 5</span></div>{loading ? <div className="popup-loading">Loading encrypted vault…</div> : filtered.length === 0 ? <div className="popup-empty-card"><EmptyState compact title="No credentials found" description="Try another search." /></div> : <PopupCredentialList credentials={filtered} onOpen={(id) => openVault(`credential-${id}`)} />}</section>}
        <section className="quick-actions"><h2>Quick actions</h2><div className="quick-actions__grid"><Button variant="secondary" leadingIcon={<Icon name="add" size={17} />} onClick={() => openVault("vault-add")}>Add</Button><Button variant="secondary" leadingIcon={<Icon name="generate" size={17} />} onClick={() => setActiveView("generator")}>Generate</Button></div></section>
      </div>
      <footer className="popup-footer"><Button fullWidth onClick={() => openVault()} trailingIcon={<Icon name="arrow" size={18} />}>Open full vault</Button></footer>
    </main>
  );
}

export function PopupApp() {
  return <AuthGate context="popup">{({ lock }) => <CredentialProvider><UnlockedPopup onLock={lock} /></CredentialProvider>}</AuthGate>;
}
