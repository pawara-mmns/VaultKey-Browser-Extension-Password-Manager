import { fillLoginInPage } from "../content/fillLogin";
import type { CredentialSiteMetadata } from "../types/credential";
import type { FillResult, PageFillRequest } from "../types/fill";
import { getDomainMatchType, normalizeHostname } from "../utils/domain";
import { getActiveTab } from "./currentTabService";
import { getCredential, getCredentialSiteMetadata } from "./credentialService";
import { resolveCredentialHostname } from "./siteMatchingService";

interface ValidatedFillTarget {
  tabId: number;
  hostname: string;
  metadata: CredentialSiteMetadata;
}

export async function validateCurrentSiteBeforeFill(credentialId: string): Promise<ValidatedFillTarget | FillResult> {
  let metadata: CredentialSiteMetadata;
  try {
    metadata = await getCredentialSiteMetadata(credentialId);
  } catch {
    return { success: false, reason: "CREDENTIAL_UNAVAILABLE" };
  }

  const tab = await getActiveTab();
  if (typeof tab?.id !== "number" || typeof tab.url !== "string") return { success: false, reason: "UNSUPPORTED_SITE" };
  const currentHostname = normalizeHostname(tab.url);
  const storedHostname = resolveCredentialHostname(metadata);
  if (!currentHostname || !storedHostname) return { success: false, reason: "UNSUPPORTED_SITE" };
  if (getDomainMatchType(currentHostname, storedHostname) === "none") return { success: false, reason: "SITE_CHANGED" };
  return { tabId: tab.id, hostname: currentHostname, metadata };
}

export async function executeFillScript(tabId: number, request: PageFillRequest): Promise<FillResult> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId, frameIds: [0] },
      world: "ISOLATED",
      func: fillLoginInPage,
      args: [request],
    });
    return results[0]?.result ?? { success: false, reason: "INJECTION_DENIED" };
  } catch {
    return { success: false, reason: "INJECTION_DENIED" };
  }
}

export async function fillCredential(credentialId: string): Promise<FillResult> {
  const validation = await validateCurrentSiteBeforeFill(credentialId);
  if ("success" in validation) return validation;

  let username = "";
  let password = "";
  try {
    const credential = await getCredential(credentialId);
    const latestStoredHostname = resolveCredentialHostname({ hostname: credential.hostname ?? "", website: credential.website });
    if (!latestStoredHostname || getDomainMatchType(validation.hostname, latestStoredHostname) === "none") {
      return { success: false, reason: "SITE_CHANGED" };
    }
    username = credential.username;
    password = credential.password;
    return await executeFillScript(validation.tabId, { username, password, expectedHostname: validation.hostname });
  } catch {
    return { success: false, reason: "CREDENTIAL_UNAVAILABLE" };
  } finally {
    username = "";
    password = "";
  }
}

export function interpretFillResult(result: FillResult): string {
  if (result.success) {
    return result.usernameFilled
      ? "Login details filled. Review the page and sign in manually."
      : "Password filled. No username field was detected.";
  }
  switch (result.reason) {
    case "SITE_CHANGED": return "The active website changed. Nothing was filled.";
    case "DOMAIN_CHANGED": return "The page changed before filling. Nothing was filled.";
    case "NO_PASSWORD_FIELD": return "No safe password field was found on this page.";
    case "AMBIGUOUS_PASSWORD_FIELDS": return "Multiple password fields were found, so VaultKey did not fill the page.";
    case "UNSUPPORTED_FORM": return "VaultKey could not safely identify a login form.";
    case "UNSUPPORTED_SITE": return "Quick Fill is unavailable on this page.";
    case "CREDENTIAL_UNAVAILABLE": return "The selected credential could not be opened.";
    case "INJECTION_DENIED": return "VaultKey could not access this page for Quick Fill.";
  }
}
