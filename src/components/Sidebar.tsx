import type { NavPage } from "../types";
import { NAVIGATION_ITEMS } from "../utils/helpers";
import { Icon } from "./Icon";
import { Logo } from "./Logo";

interface SidebarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  onLock: () => void;
}

export function Sidebar({ activePage, onNavigate, onLock }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        <Logo />
        <nav className="sidebar__nav" aria-label="Vault navigation">
          {NAVIGATION_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`sidebar__item${activePage === item.id ? " sidebar__item--active" : ""}`}
              type="button"
              aria-current={activePage === item.id ? "page" : undefined}
              onClick={() => onNavigate(item.id)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="sidebar__footer">
        <div className="sidebar__privacy"><span className="status-dot" /> Local demo mode</div>
        <button className="sidebar__item" type="button" onClick={onLock}>
          <Icon name="lock" size={19} />
          <span>Lock Vault</span>
        </button>
      </div>
    </aside>
  );
}
