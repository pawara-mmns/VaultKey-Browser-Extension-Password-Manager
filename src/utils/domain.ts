import type { DomainMatchType } from "../types/currentSite";

const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"]);

export function stripCommonWwwPrefix(hostname: string): string {
  return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
}

function parseWebUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    return SUPPORTED_PROTOCOLS.has(parsed.protocol.toLowerCase()) ? parsed : null;
  } catch {
    return null;
  }
}

export function normalizeHostname(input: string): string | null {
  const parsed = parseWebUrl(input);
  if (!parsed) return null;
  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  return hostname ? stripCommonWwwPrefix(hostname) : null;
}

export function normalizeWebsiteInput(input: string): { website: string; hostname: string } | null {
  const parsed = parseWebUrl(input);
  const hostname = normalizeHostname(input);
  if (!parsed || !hostname) return null;
  return { website: parsed.href, hostname };
}

export function isIpHostname(hostname: string): boolean {
  if (hostname.startsWith("[") && hostname.endsWith("]")) return true;
  const parts = hostname.split(".");
  return parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

export function getDomainMatchType(currentHostname: string, storedHostname: string): DomainMatchType {
  const current = normalizeHostname(currentHostname);
  const stored = normalizeHostname(storedHostname);
  if (!current || !stored) return "none";
  if (current === stored) return "exact";
  if (isIpHostname(current) || isIpHostname(stored) || current === "localhost" || stored === "localhost") return "none";
  return current.endsWith(`.${stored}`) ? "subdomain" : "none";
}

