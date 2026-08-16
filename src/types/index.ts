export type NavPage = "dashboard" | "vault" | "favorites" | "generator" | "security" | "settings";

export interface CurrentSite {
  hostname: string;
}

export interface NavigationItem {
  id: NavPage;
  label: string;
  icon: IconName;
}

export type IconName =
  | "add"
  | "arrow"
  | "check"
  | "chevron"
  | "copy"
  | "dashboard"
  | "delete"
  | "edit"
  | "eye"
  | "eyeOff"
  | "filter"
  | "generate"
  | "globe"
  | "key"
  | "lock"
  | "search"
  | "security"
  | "settings"
  | "shield"
  | "sparkle"
  | "star"
  | "vault";
