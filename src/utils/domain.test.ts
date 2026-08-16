import { describe, expect, it } from "vitest";
import { getDomainMatchType, normalizeHostname } from "./domain";

describe("domain normalization", () => {
  it.each([
    ["HTTPS://GitHub.COM/login", "github.com"],
    ["https://www.github.com/path?tab=1#top", "github.com"],
    ["github.com", "github.com"],
    ["https://login.github.com/", "login.github.com"],
    ["https://github.com.:443/login", "github.com"],
    ["http://localhost:3000/login", "localhost"],
    ["http://192.168.1.5:8080/", "192.168.1.5"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeHostname(input)).toBe(expected);
  });

  it.each(["", "not a valid host", "chrome://extensions", "file:///tmp/test", "data:text/plain,hello", "javascript:alert(1)"])("rejects unsupported input %s", (input) => {
    expect(normalizeHostname(input)).toBeNull();
  });
});

describe("strict hostname matching", () => {
  it("classifies exact, www-equivalent, and directional subdomain matches", () => {
    expect(getDomainMatchType("github.com", "github.com")).toBe("exact");
    expect(getDomainMatchType("www.github.com", "github.com")).toBe("exact");
    expect(getDomainMatchType("login.github.com", "github.com")).toBe("subdomain");
    expect(getDomainMatchType("github.com", "login.github.com")).toBe("none");
  });

  it.each([
    "paypal-login.example.com",
    "paypal.com.evil.example",
    "paypa1.com",
    "evilpaypal.com",
  ])("rejects phishing-style hostname %s", (current) => {
    expect(getDomainMatchType(current, "paypal.com")).toBe("none");
  });

  it("requires exact matches for IP addresses and localhost while ignoring ports", () => {
    expect(getDomainMatchType("192.168.1.5", "192.168.1.5")).toBe("exact");
    expect(getDomainMatchType("10.192.168.1.5", "192.168.1.5")).toBe("none");
    expect(getDomainMatchType("http://localhost:5173", "http://localhost:3000")).toBe("exact");
    expect(getDomainMatchType("app.localhost", "localhost")).toBe("none");
  });
});

