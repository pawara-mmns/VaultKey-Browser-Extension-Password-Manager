import { useEffect, useState } from "react";
import { AuthGate } from "../auth/AuthGate";
import { Icon } from "../components/Icon";
import { Sidebar } from "../components/Sidebar";
import { CredentialProvider } from "../credentials/CredentialProvider";
import { CredentialWorkspace, type CredentialWorkspaceState } from "../credentials/CredentialWorkspace";
import { DashboardPage } from "../pages/DashboardPage";
import { FavoritesPage } from "../pages/FavoritesPage";
import { GeneratorPage } from "../pages/GeneratorPage";
import { SecurityPage } from "../pages/SecurityPage";
import { SettingsPage } from "../pages/SettingsPage";
import { VaultPage } from "../pages/VaultPage";
import type { NavPage } from "../types";
import { NAVIGATION_ITEMS } from "../utils/helpers";

const pageIds = new Set<NavPage>(NAVIGATION_ITEMS.map((item) => item.id));

function getInitialPage(): NavPage {
  const hash = window.location.hash.slice(1);
  if (hash === "vault-add" || hash.startsWith("credential-")) return "vault";
  return pageIds.has(hash as NavPage) ? hash as NavPage : "dashboard";
}

function getInitialWorkspace(): CredentialWorkspaceState {
  const hash = window.location.hash.slice(1);
  if (hash === "vault-add") return { kind: "add" };
  if (hash.startsWith("credential-")) return { kind: "details", credentialId: hash.slice("credential-".length) };
  return { kind: "closed" };
}

function UnlockedVaultApp({ onLock }: { onLock: () => Promise<void> }) {
  const [activePage, setActivePage] = useState<NavPage>(getInitialPage);
  const [workspace, setWorkspace] = useState<CredentialWorkspaceState>(getInitialWorkspace);

  useEffect(() => {
    const handleHashChange = () => {
      setActivePage(getInitialPage());
      if (window.location.hash === "#vault-add") setWorkspace({ kind: "add" });
      else if (window.location.hash.startsWith("#credential-")) setWorkspace({ kind: "details", credentialId: window.location.hash.slice("#credential-".length) });
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (page: NavPage) => {
    setWorkspace({ kind: "closed" });
    setActivePage(page);
    window.history.replaceState(null, "", `#${page}`);
  };
  const addCredential = (initialPassword?: string) => setWorkspace({ kind: "add", initialPassword });
  const openCredential = (credentialId: string) => setWorkspace({ kind: "details", credentialId });

  return (
    <CredentialProvider>
      <div className="vault-app">
        <Sidebar activePage={activePage} onNavigate={navigate} onLock={() => void onLock()} />
        <div className="vault-app__main">
          <div className="topbar"><div className="topbar__breadcrumb"><span>VaultKey</span><Icon name="chevron" size={14} /><strong>{NAVIGATION_ITEMS.find((item) => item.id === activePage)?.label}</strong></div><div className="topbar__status"><span className="status-dot" /> Local vault</div></div>
          <div className="page-scroll">
            {activePage === "dashboard" && <DashboardPage onNavigate={navigate} onAdd={() => addCredential()} onOpen={openCredential} />}
            {activePage === "vault" && <VaultPage onAdd={() => addCredential()} onOpen={openCredential} />}
            {activePage === "favorites" && <FavoritesPage onOpen={openCredential} />}
            {activePage === "generator" && <GeneratorPage onSaveToVault={(password) => addCredential(password)} />}
            {activePage === "security" && <SecurityPage />}
            {activePage === "settings" && <SettingsPage />}
          </div>
        </div>
        <CredentialWorkspace state={workspace} onChange={setWorkspace} />
      </div>
    </CredentialProvider>
  );
}

export function VaultApp() {
  return <AuthGate context="vault">{({ lock }) => <UnlockedVaultApp onLock={lock} />}</AuthGate>;
}
