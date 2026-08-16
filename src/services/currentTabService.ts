import type { CurrentSite } from "../types/currentSite";
import { normalizeHostname } from "../utils/domain";

const unavailableSite: CurrentSite = { url: "", hostname: "", displayHostname: "", supported: false };

export async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUrl(): Promise<string | null> {
  const tab = await getActiveTab();
  return typeof tab?.url === "string" && tab.url ? tab.url : null;
}

export async function getCurrentSite(): Promise<CurrentSite> {
  const url = await getCurrentUrl();
  if (!url) return unavailableSite;
  const hostname = normalizeHostname(url);
  if (!hostname) return unavailableSite;
  return { url, hostname, displayHostname: hostname, supported: true };
}

export async function getCurrentHostname(): Promise<string | null> {
  const site = await getCurrentSite();
  return site.supported ? site.hostname : null;
}

