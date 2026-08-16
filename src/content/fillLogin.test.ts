// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://github.com/login"}

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fillLoginInPage } from "./fillLogin";

const request = { username: "test-user@example.test", password: "test-only-fill-secret", expectedHostname: "github.com" };

beforeEach(() => {
  document.body.innerHTML = "";
  localStorage.clear();
  sessionStorage.clear();
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({
    width: 160,
    height: 32,
    top: 0,
    right: 160,
    bottom: 32,
    left: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }));
});

describe("controlled page login filling", () => {
  it("fills a standard login form, dispatches events, and never submits or clicks", () => {
    document.body.innerHTML = `<form><input type="email"><input type="password"><button type="submit">Sign In</button></form>`;
    const form = document.querySelector("form")!;
    const button = document.querySelector("button")!;
    const username = document.querySelector<HTMLInputElement>("input[type='email']")!;
    const password = document.querySelector<HTMLInputElement>("input[type='password']")!;
    let submitCount = 0;
    let clickCount = 0;
    let inputCount = 0;
    form.addEventListener("submit", (event) => { event.preventDefault(); submitCount += 1; });
    button.addEventListener("click", () => { clickCount += 1; });
    form.addEventListener("input", () => { inputCount += 1; });

    expect(fillLoginInPage(request)).toEqual({ success: true, usernameFilled: true, passwordFilled: true });
    expect(username.value).toHaveLength(request.username.length);
    expect(password.value).toHaveLength(request.password.length);
    expect(inputCount).toBe(2);
    expect(submitCount).toBe(0);
    expect(clickCount).toBe(0);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("prioritizes autocomplete username/current-password signals", () => {
    document.body.innerHTML = `<div><input type="text" autocomplete="username"><input type="password" autocomplete="current-password"></div>`;
    const result = fillLoginInPage(request);
    expect(result).toEqual({ success: true, usernameFilled: true, passwordFilled: true });
    expect(document.querySelector<HTMLInputElement>("[autocomplete='username']")!.value).toHaveLength(request.username.length);
  });

  it("leaves an unrelated search field untouched and fills the same-form email", () => {
    document.body.innerHTML = `<input type="text" name="search"><form><input type="email" name="email"><input type="password"></form>`;
    expect(fillLoginInPage(request).success).toBe(true);
    expect(document.querySelector<HTMLInputElement>("[name='search']")!.value).toBe("");
    expect(document.querySelector<HTMLInputElement>("[name='email']")!.value).toHaveLength(request.username.length);
  });

  it("aborts change-password and signup forms without filling any password", () => {
    document.body.innerHTML = `<form><input type="password" autocomplete="current-password"><input type="password" autocomplete="new-password"><input type="password" autocomplete="new-password"></form>`;
    expect(fillLoginInPage(request)).toEqual({ success: false, reason: "UNSUPPORTED_FORM" });
    expect(Array.from(document.querySelectorAll<HTMLInputElement>("input")).every((input) => input.value === "")).toBe(true);

    document.body.innerHTML = `<form aria-label="Create Account"><input type="email"><input type="password"><button>Create Account</button></form>`;
    expect(fillLoginInPage(request)).toEqual({ success: false, reason: "UNSUPPORTED_FORM" });
    expect(document.querySelector<HTMLInputElement>("input[type='password']")!.value).toBe("");
  });

  it("rejects multiple ambiguous password fields before changing values", () => {
    document.body.innerHTML = `<form><input type="text" name="username"><input type="password"><input type="password"></form>`;
    expect(fillLoginInPage(request)).toEqual({ success: false, reason: "AMBIGUOUS_PASSWORD_FIELDS" });
    expect(Array.from(document.querySelectorAll<HTMLInputElement>("input")).every((input) => input.value === "")).toBe(true);
  });

  it("prefers one explicit current-password field over a generic password input", () => {
    document.body.innerHTML = `<form><input type="email"><input type="password" name="secondary"><input type="password" autocomplete="current-password"></form>`;
    const passwords = document.querySelectorAll<HTMLInputElement>("input[type='password']");

    expect(fillLoginInPage(request)).toEqual({ success: true, usernameFilled: true, passwordFilled: true });
    expect(passwords[0].value).toBe("");
    expect(passwords[1].value).toHaveLength(request.password.length);
  });

  it("ignores hidden password fields and uses the one visible login field", () => {
    document.body.innerHTML = `<form><input type="email"><input type="password" style="display:none"><input type="password"></form>`;
    expect(fillLoginInPage(request).success).toBe(true);
    const passwords = document.querySelectorAll<HTMLInputElement>("input[type='password']");
    expect(passwords[0].value).toBe("");
    expect(passwords[1].value).toHaveLength(request.password.length);
  });

  it("does not fill disabled or read-only fields", () => {
    document.body.innerHTML = `<form><input type="email" disabled><input type="password" readonly></form>`;
    expect(fillLoginInPage(request)).toEqual({ success: false, reason: "NO_PASSWORD_FIELD" });
    expect(Array.from(document.querySelectorAll<HTMLInputElement>("input")).every((input) => input.value === "")).toBe(true);
  });

  it("does not fill username-only first steps", () => {
    document.body.innerHTML = `<form><input type="email" autocomplete="username"><button>Next</button></form>`;
    expect(fillLoginInPage(request)).toEqual({ success: false, reason: "NO_PASSWORD_FIELD" });
    expect(document.querySelector<HTMLInputElement>("input")!.value).toBe("");
  });

  it("supports a clear password-only reauthentication page as a partial success", () => {
    document.body.innerHTML = `<form><input type="password" autocomplete="current-password"></form>`;
    expect(fillLoginInPage(request)).toEqual({ success: true, usernameFilled: false, passwordFilled: true });
    expect(document.querySelector<HTMLInputElement>("input")!.value).toHaveLength(request.password.length);
  });

  it("does not reach broadly across a form-less page for a distant email field", () => {
    document.body.innerHTML = `
      <input type="email" name="newsletter-email">
      <input type="text" name="unrelated-one">
      <input type="text" name="unrelated-two">
      <input type="text" name="unrelated-three">
      <section aria-label="Sign in"><input type="password" autocomplete="current-password"></section>
    `;
    const result = fillLoginInPage(request);

    expect(result).toEqual({ success: true, usernameFilled: false, passwordFilled: true });
    expect(document.querySelector<HTMLInputElement>("[name='newsletter-email']")!.value).toBe("");
  });

  it("aborts when the injected page hostname differs from the revalidated hostname", () => {
    document.body.innerHTML = `<form><input type="email"><input type="password"></form>`;
    expect(fillLoginInPage({ ...request, expectedHostname: "example.com" })).toEqual({ success: false, reason: "DOMAIN_CHANGED" });
    expect(Array.from(document.querySelectorAll<HTMLInputElement>("input")).every((input) => input.value === "")).toBe(true);
  });
});
