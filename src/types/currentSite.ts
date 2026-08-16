export interface CurrentSite {
  url: string;
  hostname: string;
  displayHostname: string;
  supported: boolean;
}

export type DomainMatchType = "exact" | "subdomain" | "none";

