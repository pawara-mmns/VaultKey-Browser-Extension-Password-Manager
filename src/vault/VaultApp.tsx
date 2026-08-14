import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { Sidebar } from "../components/Sidebar";
import { UnlockPanel } from "../components/UnlockPanel";
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

export function VaultApp() {
  const [isUnlocked, setIsUnlocked] = useState(true);
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

  if (!isUnlocked) {
    return <UnlockPanel context="vault" onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div className="vault-app">
      <Sidebar activePage={activePage} onNavigate={navigate} onLock={() => setIsUnlocked(false)} />
      <div className="vault-app__main">
        <div className="topbar">
          <div className="topbar__breadcrumb">
            <span>VaultKey</span><Icon name="chevron" size={14} />
            <strong>{NAVIGATION_ITEMS.find((item) => item.id === activePage)?.label}</strong>
          </div>
          <div className="topbar__status"><span className="status-dot" /> Local demo</div>
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
