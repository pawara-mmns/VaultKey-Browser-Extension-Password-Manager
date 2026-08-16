import type { FillResult, PageFillRequest } from "../types/fill";

// This function is intentionally self-contained because Chrome serializes it for
// one user-initiated, main-frame execution. It has no access to extension storage.
export function fillLoginInPage(request: PageFillRequest): FillResult {
  const normalizePageHostname = (hostname: string): string => {
    const normalized = hostname.toLowerCase().replace(/\.$/, "");
    return normalized.startsWith("www.") ? normalized.slice(4) : normalized;
  };

  if (window.location.protocol !== "http:" && window.location.protocol !== "https:") {
    return { success: false, reason: "UNSUPPORTED_SITE" };
  }
  if (normalizePageHostname(window.location.hostname) !== request.expectedHostname) {
    return { success: false, reason: "DOMAIN_CHANGED" };
  }

  const isInteractable = (input: HTMLInputElement): boolean => {
    if (!input.isConnected || input.disabled || input.readOnly || input.type.toLowerCase() === "hidden") return false;
    const style = window.getComputedStyle(input);
    if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse" || style.opacity === "0") return false;
    const bounds = input.getBoundingClientRect();
    return bounds.width > 0 && bounds.height > 0;
  };

  const inputs = Array.from(document.querySelectorAll("input")).filter((element): element is HTMLInputElement => element instanceof HTMLInputElement);
  const passwordFields = inputs.filter((input) => input.type.toLowerCase() === "password" && isInteractable(input));
  if (passwordFields.length === 0) return { success: false, reason: "NO_PASSWORD_FIELD" };

  const fieldSignal = (input: HTMLInputElement): string => [input.autocomplete, input.name, input.id, input.getAttribute("aria-label") ?? ""].join(" ").toLowerCase();
  const hasNewPasswordSignal = passwordFields.some((input) => input.autocomplete.toLowerCase() === "new-password" || /(?:new|confirm|repeat)[-_ ]?password/.test(fieldSignal(input)));
  if (hasNewPasswordSignal) return { success: false, reason: "UNSUPPORTED_FORM" };
  const currentPasswordFields = passwordFields.filter((input) => input.autocomplete.toLowerCase() === "current-password");
  if (currentPasswordFields.length > 1 || (currentPasswordFields.length === 0 && passwordFields.length > 1)) {
    return { success: false, reason: "AMBIGUOUS_PASSWORD_FIELDS" };
  }

  const passwordField = currentPasswordFields[0] ?? passwordFields[0];
  const passwordForm = passwordField.form;
  if (passwordForm) {
    const formSignal = [passwordForm.id, passwordForm.className, passwordForm.getAttribute("name") ?? "", passwordForm.getAttribute("action") ?? "", passwordForm.getAttribute("aria-label") ?? ""].join(" ").toLowerCase();
    const actionSignal = Array.from(passwordForm.querySelectorAll("button, input[type='submit']"))
      .map((element) => `${element.textContent ?? ""} ${(element as HTMLInputElement).value ?? ""}`)
      .join(" ")
      .toLowerCase();
    if (/(?:sign\s*up|register|create\s*account|reset\s*password|change\s*password)/.test(`${formSignal} ${actionSignal}`)) {
      return { success: false, reason: "UNSUPPORTED_FORM" };
    }
  }

  const passwordIndex = inputs.indexOf(passwordField);
  const logicalContainer = passwordForm
    ?? passwordField.closest("[role='dialog'], section, article, main")
    ?? passwordField.parentElement;
  const candidateScope = logicalContainer ? Array.from(logicalContainer.querySelectorAll("input")) : [];
  const usernameCandidates = candidateScope
    .filter((element): element is HTMLInputElement => element instanceof HTMLInputElement && element !== passwordField && isInteractable(element))
    .map((input) => {
      const type = input.type.toLowerCase();
      const autocomplete = input.autocomplete.toLowerCase();
      if (!["text", "email", "tel", ""].includes(type) || ["new-password", "current-password", "one-time-code"].includes(autocomplete) || type === "search") return null;
      const inputIndex = inputs.indexOf(input);
      if (!passwordForm && (inputIndex < 0 || inputIndex >= passwordIndex || passwordIndex - inputIndex > 3)) return null;
      let score = 0;
      if (autocomplete === "username") score += 100;
      if (type === "email") score += 80;
      if (/(?:user(?:name)?|email|login)/.test(fieldSignal(input))) score += 60;
      if (passwordForm && input.form === passwordForm) score += 30;
      if (inputIndex >= 0 && inputIndex < passwordIndex) score += Math.max(1, 10 - (passwordIndex - inputIndex));
      return score > 0 ? { input, score } : null;
    })
    .filter((candidate): candidate is { input: HTMLInputElement; score: number } => candidate !== null)
    .sort((first, second) => second.score - first.score);

  const usernameField = usernameCandidates.length > 0 && (usernameCandidates.length === 1 || usernameCandidates[0].score > usernameCandidates[1].score)
    ? usernameCandidates[0].input
    : null;

  const setInputValue = (input: HTMLInputElement, value: string) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (setter) setter.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  if (usernameField) setInputValue(usernameField, request.username);
  setInputValue(passwordField, request.password);
  return { success: true, usernameFilled: usernameField !== null, passwordFilled: true };
}
