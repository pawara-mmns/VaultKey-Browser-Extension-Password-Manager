import type { NavigationItem } from "../types";

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "vault", label: "Vault", icon: "vault" },
  { id: "favorites", label: "Favorites", icon: "star" },
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
