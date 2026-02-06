import { z } from "zod";
import { REQUIRED_TERMS_TYPES } from "@/features/auth/constants";

export const AppRoleSchema = z.enum(["advertiser", "influencer"]);
export type AppRole = z.infer<typeof AppRoleSchema>;

const passwordMinLength = 6;

// 1. 먼저 .refine 없이 순수한 객체 스키마만 정의합니다.
export const SignupRequestBaseSchema = z.object({
  name: z.string().min(1, "이름을 입력해 주세요."),
  phone: z.string().min(1, "휴대폰 번호를 입력해 주세요."),
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
  password: z
    .string()
    .min(passwordMinLength, `비밀번호는 ${passwordMinLength}자 이상이어야 합니다.`),
  confirmPassword: z.string(),
  role: AppRoleSchema,
  acceptedTermsTypes: z
    .array(z.string())
    .min(1, "필수 약관에 동의해 주세요.")
    .refine(
      (types) =>
        REQUIRED_TERMS_TYPES.every((required) => types.includes(required)),
      "필수 약관에 모두 동의해 주세요."
    ),
});

// 2. 위에서 만든 베이스를 가지고 .refine(비밀번호 확인 로직)을 추가합니다.
export const SignupRequestSchema = SignupRequestBaseSchema.refine(
  (data) => data.password === data.confirmPassword, 
  {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  }
);

export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const SignupResponseSchema = z.object({
  redirectTo: z.string(),
  role: AppRoleSchema.optional(),
});

export type SignupResponse = z.infer<typeof SignupResponseSchema>;

// 3. 이제 SignupRequestBaseSchema(순수 객체)를 사용하므로 .omit이 정상 작동합니다.
export const SignupRequestBodySchema = SignupRequestBaseSchema.omit({
  confirmPassword: true,
}).extend({
  acceptedTermsTypes: z.array(z.string()).min(1),
});

export type SignupRequestBody = z.infer<typeof SignupRequestBodySchema>;