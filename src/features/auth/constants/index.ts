import type { AppRole } from "@/constants/auth";

export const AUTH_SIGNUP_API_PATH = "/api/auth/signup";

export const REQUIRED_TERMS_TYPES = ["service", "privacy"] as const;

export type RequiredTermsType = (typeof REQUIRED_TERMS_TYPES)[number];

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  advertiser: "광고주",
  influencer: "인플루언서",
} as const;

export const TERMS_TYPE_LABELS: Record<RequiredTermsType, string> = {
  service: "서비스 이용약관",
  privacy: "개인정보처리방침",
} as const;
