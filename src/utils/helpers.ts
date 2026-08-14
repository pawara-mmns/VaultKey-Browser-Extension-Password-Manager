import type { CredentialSummary, CurrentSite, NavigationItem } from "../types";

export const CURRENT_SITE_MOCK: CurrentSite = { hostname: "github.com" };

export const MATCHING_CREDENTIALS_MOCK: CredentialSummary[] = [
  {
    id: "demo-github",
    serviceName: "GitHub",
    username: "user@example.com",
    website: "github.com",
    favorite: true,
    accent: "var(--text-primary)",
  },
];

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "vault", label: "Vault", icon: "vault" },
  { id: "generator", label: "Generator", icon: "generate" },
  { id: "security", label: "Security", icon: "security" },
  { id: "settings", label: "Settings", icon: "settings" },
];

export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
