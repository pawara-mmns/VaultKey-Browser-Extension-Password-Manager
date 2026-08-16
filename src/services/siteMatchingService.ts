import type { CredentialSummary } from "../types/credential";
import type { DomainMatchType } from "../types/currentSite";
import { getDomainMatchType, normalizeHostname } from "../utils/domain";

export interface CredentialSiteMatch {
  credential: CredentialSummary;
  matchType: Exclude<DomainMatchType, "none">;
}

export function resolveCredentialHostname(credential: Pick<CredentialSummary, "hostname" | "website">): string | null {
  return normalizeHostname(credential.hostname) ?? normalizeHostname(credential.website);
}

export function findMatchingCredentials(currentHostname: string, credentials: CredentialSummary[]): CredentialSiteMatch[] {
  return credentials.flatMap((credential): CredentialSiteMatch[] => {
    const storedHostname = resolveCredentialHostname(credential);
    if (!storedHostname) return [];
    const matchType = getDomainMatchType(currentHostname, storedHostname);
    return matchType === "none" ? [] : [{ credential, matchType }];
  }).sort((first, second) => {
    const matchRank = Number(second.matchType === "exact") - Number(first.matchType === "exact");
    if (matchRank !== 0) return matchRank;
    const favoriteRank = Number(second.credential.favorite) - Number(first.credential.favorite);
    if (favoriteRank !== 0) return favoriteRank;
    return Date.parse(second.credential.updatedAt) - Date.parse(first.credential.updatedAt);
  });
}
