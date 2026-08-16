import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentSite } from "./currentTabService";

let query: ReturnType<typeof vi.fn>;

beforeEach(() => {
  query = vi.fn();
  vi.stubGlobal("chrome", { tabs: { query } });
});

describe("current tab service", () => {
  it("queries only the active tab in the current window and returns a normalized web site", async () => {
    query.mockResolvedValue([{ id: 1, url: "https://www.GitHub.com/login?next=%2F" }]);
    await expect(getCurrentSite()).resolves.toEqual({
      url: "https://www.GitHub.com/login?next=%2F",
      hostname: "github.com",
      displayHostname: "github.com",
      supported: true,
    });
    expect(query).toHaveBeenCalledWith({ active: true, currentWindow: true });
  });

  it.each([[[]], [[{ id: 1 }]], [[{ id: 1, url: "chrome://extensions" }]]])("returns an unavailable site safely", async (tabs) => {
    query.mockResolvedValue(tabs);
    expect((await getCurrentSite()).supported).toBe(false);
  });

  it("handles tab API failures without throwing", async () => {
    query.mockRejectedValue(new Error("Unavailable"));
    expect((await getCurrentSite()).supported).toBe(false);
  });
});
