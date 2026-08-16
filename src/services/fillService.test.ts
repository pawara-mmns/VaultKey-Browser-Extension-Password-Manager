import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CredentialSiteMetadata, DecryptedCredential } from "../types/credential";

const mocks = vi.hoisted(() => ({
  getActiveTab: vi.fn(),
  getCredential: vi.fn(),
  getCredentialSiteMetadata: vi.fn(),
}));

vi.mock("./currentTabService", () => ({ getActiveTab: mocks.getActiveTab }));
vi.mock("./credentialService", () => ({
  getCredential: mocks.getCredential,
  getCredentialSiteMetadata: mocks.getCredentialSiteMetadata,
}));

import { executeFillScript, fillCredential, interpretFillResult } from "./fillService";

const metadata: CredentialSiteMetadata = {
  id: "credential-1",
  serviceName: "GitHub",
  website: "https://github.com/login",
  hostname: "github.com",
  favorite: false,
  createdAt: "2026-08-16T00:00:00.000Z",
  updatedAt: "2026-08-16T00:00:00.000Z",
};

const decrypted: DecryptedCredential = {
  ...metadata,
  username: "test-user@example.test",
  password: "test-only-password",
  notes: "",
};

let executeScript: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  executeScript = vi.fn(async () => [{ frameId: 0, result: { success: true, usernameFilled: true, passwordFilled: true } }]);
  vi.stubGlobal("chrome", { scripting: { executeScript } });
  mocks.getCredentialSiteMetadata.mockResolvedValue(metadata);
  mocks.getActiveTab.mockResolvedValue({ id: 42, url: "https://github.com/login" });
  mocks.getCredential.mockResolvedValue(decrypted);
});

describe("controlled Quick Fill service", () => {
  it.each([
    "https://github.com.evil.example/login",
    "https://github-login.example/login",
    "https://evilgithub.com/login",
  ])("aborts phishing-style domain %s before decrypting or injecting", async (url) => {
    mocks.getActiveTab.mockResolvedValue({ id: 42, url });

    await expect(fillCredential(metadata.id)).resolves.toEqual({ success: false, reason: "SITE_CHANGED" });
    expect(mocks.getCredential).not.toHaveBeenCalled();
    expect(executeScript).not.toHaveBeenCalled();
  });

  it("aborts an unsupported browser page before decrypting or injecting", async () => {
    mocks.getActiveTab.mockResolvedValue({ id: 42, url: "chrome://settings/passwords" });

    await expect(fillCredential(metadata.id)).resolves.toEqual({ success: false, reason: "UNSUPPORTED_SITE" });
    expect(mocks.getCredential).not.toHaveBeenCalled();
    expect(executeScript).not.toHaveBeenCalled();
  });

  it("aborts a normal domain change before decrypting or injecting", async () => {
    mocks.getActiveTab.mockResolvedValue({ id: 42, url: "https://example.com/login" });

    await expect(fillCredential(metadata.id)).resolves.toEqual({ success: false, reason: "SITE_CHANGED" });
    expect(mocks.getCredential).not.toHaveBeenCalled();
    expect(executeScript).not.toHaveBeenCalled();
  });

  it("rejects a reverse subdomain match before decrypting", async () => {
    mocks.getCredentialSiteMetadata.mockResolvedValue({ ...metadata, website: "https://login.example.com", hostname: "login.example.com" });
    mocks.getActiveTab.mockResolvedValue({ id: 42, url: "https://example.com/login" });

    await expect(fillCredential(metadata.id)).resolves.toEqual({ success: false, reason: "SITE_CHANGED" });
    expect(mocks.getCredential).not.toHaveBeenCalled();
    expect(executeScript).not.toHaveBeenCalled();
  });

  it("revalidates metadata and active tab before decrypting, then injects only into the main frame", async () => {
    const order: string[] = [];
    mocks.getCredentialSiteMetadata.mockImplementation(async () => { order.push("metadata"); return metadata; });
    mocks.getActiveTab.mockImplementation(async () => { order.push("active-tab"); return { id: 42, url: "https://login.github.com/session" }; });
    mocks.getCredential.mockImplementation(async () => { order.push("decrypt"); return decrypted; });
    executeScript.mockImplementation(async () => {
      order.push("inject");
      return [{ frameId: 0, result: { success: true, usernameFilled: true, passwordFilled: true } }];
    });

    await expect(fillCredential(metadata.id)).resolves.toEqual({ success: true, usernameFilled: true, passwordFilled: true });
    expect(order).toEqual(["metadata", "active-tab", "decrypt", "inject"]);
    expect(executeScript).toHaveBeenCalledOnce();
    const injection = executeScript.mock.calls[0][0];
    expect(injection.target).toEqual({ tabId: 42, frameIds: [0] });
    expect(injection.world).toBe("ISOLATED");
    expect(injection.func).toBeTypeOf("function");
    expect(injection.args).toHaveLength(1);
    expect(injection.args[0]).toMatchObject({ expectedHostname: "login.github.com" });
  });

  it("rechecks credential metadata after decrypting and refuses a changed credential", async () => {
    mocks.getCredential.mockResolvedValue({ ...decrypted, website: "https://example.com/login", hostname: "example.com" });

    await expect(fillCredential(metadata.id)).resolves.toEqual({ success: false, reason: "SITE_CHANGED" });
    expect(executeScript).not.toHaveBeenCalled();
  });

  it("maps denied or empty script injection to a safe result", async () => {
    executeScript.mockRejectedValueOnce(new Error("permission denied"));
    await expect(executeFillScript(42, { username: "u", password: "p", expectedHostname: "github.com" }))
      .resolves.toEqual({ success: false, reason: "INJECTION_DENIED" });

    executeScript.mockResolvedValueOnce([]);
    await expect(executeFillScript(42, { username: "u", password: "p", expectedHostname: "github.com" }))
      .resolves.toEqual({ success: false, reason: "INJECTION_DENIED" });
  });

  it("provides explicit manual-submit feedback for complete and partial fills", () => {
    expect(interpretFillResult({ success: true, usernameFilled: true, passwordFilled: true }))
      .toContain("sign in manually");
    expect(interpretFillResult({ success: true, usernameFilled: false, passwordFilled: true }))
      .toContain("Password filled");
    expect(interpretFillResult({ success: false, reason: "AMBIGUOUS_PASSWORD_FIELDS" }))
      .toContain("Multiple password fields");
  });
});
