// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CredentialSummary } from "../../types/credential";

const mocks = vi.hoisted(() => ({ getCredential: vi.fn() }));
vi.mock("../../services/credentialService", () => ({ getCredential: mocks.getCredential }));

import { PopupCredentialList } from "./PopupCredentialList";

const credentials: CredentialSummary[] = [
  {
    id: "personal",
    serviceName: "Personal",
    username: "personal@example.test",
    website: "https://example.com/login",
    hostname: "example.com",
    favorite: false,
    unreadable: false,
    createdAt: "2026-08-16T00:00:00.000Z",
    updatedAt: "2026-08-16T00:00:00.000Z",
  },
  {
    id: "work",
    serviceName: "Work",
    username: "work@example.test",
    website: "https://example.com/login",
    hostname: "example.com",
    favorite: false,
    unreadable: false,
    createdAt: "2026-08-16T00:00:00.000Z",
    updatedAt: "2026-08-16T00:00:00.000Z",
  },
];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.clearAllMocks();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

async function renderList(props: Partial<React.ComponentProps<typeof PopupCredentialList>> = {}) {
  await act(async () => {
    root.render(<PopupCredentialList credentials={credentials} onOpen={() => undefined} {...props} />);
  });
}

describe("popup credential actions", () => {
  it("renders one account-specific Fill Login button per matching credential", async () => {
    const onFill = vi.fn();
    await renderList({ onFill });
    const fillButtons = Array.from(container.querySelectorAll("button")).filter((button) => button.textContent?.includes("Fill Login"));

    expect(fillButtons).toHaveLength(2);
    fillButtons[1].click();
    expect(onFill).toHaveBeenCalledWith("work");
  });

  it("does not expose Fill Login in the generic credential-list mode", async () => {
    await renderList();
    expect(container.textContent).not.toContain("Fill Login");
  });

  it("preserves explicit username and password copy actions", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    mocks.getCredential.mockResolvedValue({ ...credentials[0], password: "copy-regression-secret", notes: "" });
    await renderList({ credentials: [credentials[0]], showUsernameCopy: true });
    const buttons = Array.from(container.querySelectorAll("button"));
    const usernameButton = buttons.find((button) => button.textContent === "User")!;
    const passwordButton = buttons.find((button) => button.textContent === "Password")!;

    await act(async () => { usernameButton.click(); });
    expect(writeText).toHaveBeenCalledWith(credentials[0].username);

    await act(async () => { passwordButton.click(); });
    expect(mocks.getCredential).toHaveBeenCalledWith(credentials[0].id);
    expect(writeText).toHaveBeenCalledTimes(2);
  });
});
