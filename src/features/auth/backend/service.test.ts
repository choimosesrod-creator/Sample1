import { describe, it, expect, vi } from "vitest";
import { createAccountWithProfile } from "@/features/auth/backend/service";
import { authErrorCodes } from "@/features/auth/backend/error";
import type { SignupRequestBody } from "@/features/auth/backend/schema";

const validBody: SignupRequestBody = {
  name: "홍길동",
  phone: "01012345678",
  email: "test@example.com",
  password: "password1",
  role: "advertiser",
  acceptedTermsTypes: ["service", "privacy"],
};

function makeChainedMock<T>(resolveValue: T) {
  const single = vi.fn().mockResolvedValue(resolveValue);
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });
  return { insert, select, single };
}

describe("createAccountWithProfile", () => {
  it("returns success with redirectTo when auth and DB succeed", async () => {
    const profileChain = makeChainedMock({ data: { id: "profile-1" }, error: null });
    const termsInsert = vi.fn().mockResolvedValue({ error: null });

    const mockClient = {
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: "auth-uuid-1" } },
            error: null,
          }),
        },
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") return profileChain;
        if (table === "terms_acceptances") return { insert: termsInsert };
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }),
    } as never;

    const result = await createAccountWithProfile(mockClient, validBody);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.redirectTo).toContain("/login");
      expect(result.data.redirectTo).toContain("onboarding");
      expect(result.data.role).toBe("advertiser");
    }
    expect(mockClient.auth.admin.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: validBody.email,
        password: validBody.password,
        email_confirm: true,
      })
    );
  });

  it("returns failure with EMAIL_ALREADY_EXISTS when auth fails with duplicate", async () => {
    const mockClient = {
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "User already registered" },
          }),
        },
      },
      from: vi.fn(),
    } as never;

    const result = await createAccountWithProfile(mockClient, validBody);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(authErrorCodes.emailAlreadyExists);
      expect(result.status).toBe(409);
    }
  });

  it("returns failure with PROFILE_CREATE_FAILED when profile insert fails", async () => {
    const profileChain = makeChainedMock({ data: null, error: { message: "DB error" } });

    const mockClient = {
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: "auth-uuid-1" } },
            error: null,
          }),
        },
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") return profileChain;
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }),
    } as never;

    const result = await createAccountWithProfile(mockClient, validBody);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(authErrorCodes.profileCreateFailed);
    }
  });
});
