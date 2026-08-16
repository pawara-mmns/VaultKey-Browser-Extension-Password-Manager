export type FillFailureReason =
  | "UNSUPPORTED_SITE"
  | "SITE_CHANGED"
  | "DOMAIN_CHANGED"
  | "CREDENTIAL_UNAVAILABLE"
  | "NO_PASSWORD_FIELD"
  | "AMBIGUOUS_PASSWORD_FIELDS"
  | "UNSUPPORTED_FORM"
  | "INJECTION_DENIED";

export type FillResult =
  | { success: true; usernameFilled: boolean; passwordFilled: true }
  | { success: false; reason: FillFailureReason };

export interface PageFillRequest {
  username: string;
  password: string;
  expectedHostname: string;
}

