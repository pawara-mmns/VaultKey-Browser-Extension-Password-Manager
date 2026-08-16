import { describe, expect, it } from "vitest";
import type { CredentialSummary } from "../types/credential";
import { findMatchingCredentials } from "./siteMatchingService";

function credential(id: string, hostname: string, overrides: Partial<CredentialSummary> = {}): CredentialSummary {
  return {
    id,
    serviceName: `Service ${id}`,
    username: `${id}@example.test`,
    website: hostname ? `https://${hostname}/login` : "",
    hostname,
    favorite: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    unreadable: false,
    ...overrides,
  };
}

describe("site credential matching", () => {
  it("returns multiple accounts and sorts exact before subdomain-compatible matches", () => {
    const credentials = [credential("broad", "github.com"), credential("exact", "login.github.com"), credential("other", "linkedin.com")];
    const matches = findMatchingCredentials("login.github.com", credentials);
    expect(matches.map((match) => match.credential.id)).toEqual(["exact", "broad"]);
    expect(matches.map((match) => match.matchType)).toEqual(["exact", "subdomain"]);
  });

  it("does not use service names or fuzzy hostname matching", () => {
    const credentials = [credential("phish", "paypal.com", { serviceName: "PayPal" }), credential("name-only", "example.com", { serviceName: "GitHub" })];
    expect(findMatchingCredentials("paypal.com.evil.test", credentials)).toEqual([]);
    expect(findMatchingCredentials("github.com", credentials)).toEqual([]);
  });

  it("derives a missing legacy hostname from website metadata", () => {
    const legacy = credential("legacy", "", { website: "https://www.github.com/login" });
    expect(findMatchingCredentials("github.com", [legacy]).map((match) => match.credential.id)).toEqual(["legacy"]);
  });
});

