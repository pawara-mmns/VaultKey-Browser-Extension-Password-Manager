export type NavPage = "dashboard" | "vault" | "generator" | "security" | "settings";

export interface CurrentSite {
  hostname: string;
}

export interface CredentialSummary {
  id: string;
  serviceName: string;
  username: string;
  website: string;
  favorite: boolean;
  accent: string;
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
