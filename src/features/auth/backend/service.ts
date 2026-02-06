import type { SupabaseClient } from "@supabase/supabase-js";
import {
  failure,
  success,
  type HandlerResult,
} from "@/backend/http/response";
import { getSignupRedirectForRole } from "@/constants/auth";
import type { AppRole } from "@/constants/auth";
import {
  authErrorCodes,
  type AuthServiceError,
} from "@/features/auth/backend/error";
import type { SignupRequestBody, SignupResponse } from "@/features/auth/backend/schema";

const PROFILES_TABLE = "profiles";
const TERMS_ACCEPTANCES_TABLE = "terms_acceptances";

export const createAccountWithProfile = async (
  client: SupabaseClient,
  body: SignupRequestBody
): Promise<HandlerResult<SignupResponse, AuthServiceError, unknown>> => {
  const { data: authData, error: authError } = await client.auth.admin.createUser(
    {
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { name: body.name, phone: body.phone },
    }
  );

  if (authError) {
    const isDuplicate =
      authError.message?.toLowerCase().includes("already") ?? false;
    return failure(
      isDuplicate ? 409 : 400,
      isDuplicate ? authErrorCodes.emailAlreadyExists : authErrorCodes.authCreateFailed,
      isDuplicate ? "이미 가입된 이메일입니다." : authError.message ?? "계정 생성에 실패했습니다."
    );
  }

  const authUserId = authData?.user?.id;
  if (!authUserId) {
    return failure(
      500,
      authErrorCodes.authCreateFailed,
      "계정 생성 후 사용자 ID를 확인할 수 없습니다."
    );
  }

  const { data: profileData, error: profileError } = await client
    .from(PROFILES_TABLE)
    .insert({
      auth_user_id: authUserId,
      name: body.name,
      phone: body.phone,
      email: body.email,
      role: body.role,
    })
    .select("id")
    .single();

  if (profileError || !profileData?.id) {
    return failure(
      500,
      authErrorCodes.profileCreateFailed,
      profileError?.message ?? "프로필 저장에 실패했습니다."
    );
  }

  const termsRows = body.acceptedTermsTypes.map((termsType) => ({
    profile_id: profileData.id,
    terms_type: termsType,
  }));

  const { error: termsError } = await client
    .from(TERMS_ACCEPTANCES_TABLE)
    .insert(termsRows);

  if (termsError) {
    return failure(
      500,
      authErrorCodes.termsSaveFailed,
      termsError.message ?? "약관 이력 저장에 실패했습니다."
    );
  }

  const redirectTo = getSignupRedirectForRole(body.role as AppRole);
  return success({ redirectTo, role: body.role }, 201);
};
