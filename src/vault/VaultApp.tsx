import { useEffect, useState } from "react";
import { AuthGate } from "../auth/AuthGate";
import { Icon } from "../components/Icon";
import { Sidebar } from "../components/Sidebar";
import { DashboardPage } from "../pages/DashboardPage";
import { GeneratorPage } from "../pages/GeneratorPage";
import { SecurityPage } from "../pages/SecurityPage";
import { SettingsPage } from "../pages/SettingsPage";
import { VaultPage } from "../pages/VaultPage";
import type { NavPage } from "../types";
import { NAVIGATION_ITEMS } from "../utils/helpers";

const pageIds = new Set<NavPage>(NAVIGATION_ITEMS.map((item) => item.id));

function getInitialPage(): NavPage {
  const hash = window.location.hash.slice(1) as NavPage;
  return pageIds.has(hash) ? hash : "dashboard";
}

interface UnlockedVaultAppProps {
  onLock: () => Promise<void>;
}

function UnlockedVaultApp({ onLock }: UnlockedVaultAppProps) {
  const [activePage, setActivePage] = useState<NavPage>(getInitialPage);

  useEffect(() => {
    const handleHashChange = () => setActivePage(getInitialPage());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (page: NavPage) => {
    setActivePage(page);
    window.history.replaceState(null, "", `#${page}`);
  };

  return (
    <div className="vault-app">
      <Sidebar activePage={activePage} onNavigate={navigate} onLock={() => void onLock()} />
      <div className="vault-app__main">
        <div className="topbar">
          <div className="topbar__breadcrumb">
            <span>VaultKey</span><Icon name="chevron" size={14} />
            <strong>{NAVIGATION_ITEMS.find((item) => item.id === activePage)?.label}</strong>
          </div>
          <div className="topbar__status"><span className="status-dot" /> Local vault</div>
        </div>
        <div className="page-scroll">
          {activePage === "dashboard" && <DashboardPage onNavigate={navigate} />}
          {activePage === "vault" && <VaultPage />}
          {activePage === "generator" && <GeneratorPage />}
          {activePage === "security" && <SecurityPage />}
          {activePage === "settings" && <SettingsPage />}
        </div>
      </div>
    </div>
  );
}

export function VaultApp() {
  return (
    <AuthGate context="vault">
      {({ lock }) => <UnlockedVaultApp onLock={lock} />}
    </AuthGate>
  );
}
