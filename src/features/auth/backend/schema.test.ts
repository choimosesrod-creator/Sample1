import { describe, it, expect } from "vitest";
import {
  SignupRequestSchema,
  AppRoleSchema,
} from "@/features/auth/backend/schema";
import { REQUIRED_TERMS_TYPES } from "@/features/auth/constants";

const validPayload = {
  name: "홍길동",
  phone: "01012345678",
  email: "test@example.com",
  password: "password1",
  confirmPassword: "password1",
  role: "advertiser" as const,
  acceptedTermsTypes: [...REQUIRED_TERMS_TYPES],
};

describe("AppRoleSchema", () => {
  it("accepts advertiser and influencer", () => {
    expect(AppRoleSchema.safeParse("advertiser").success).toBe(true);
    expect(AppRoleSchema.safeParse("influencer").success).toBe(true);
  });

  it("rejects invalid role", () => {
    expect(AppRoleSchema.safeParse("invalid").success).toBe(false);
  });
});

describe("SignupRequestSchema", () => {
  it("accepts valid payload", () => {
    const result = SignupRequestSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = SignupRequestSchema.safeParse({
      ...validPayload,
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = SignupRequestSchema.safeParse({
      ...validPayload,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = SignupRequestSchema.safeParse({
      ...validPayload,
      password: "12345",
      confirmPassword: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when password and confirmPassword do not match", () => {
    const result = SignupRequestSchema.safeParse({
      ...validPayload,
      password: "password1",
      confirmPassword: "password2",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty acceptedTermsTypes", () => {
    const result = SignupRequestSchema.safeParse({
      ...validPayload,
      acceptedTermsTypes: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects when required terms are not all accepted", () => {
    const result = SignupRequestSchema.safeParse({
      ...validPayload,
      acceptedTermsTypes: [REQUIRED_TERMS_TYPES[0]],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = SignupRequestSchema.safeParse({
      ...validPayload,
      role: "invalid",
    });
    expect(result.success).toBe(false);
  });
});
