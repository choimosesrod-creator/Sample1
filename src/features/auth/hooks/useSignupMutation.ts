"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import { useToast } from "@/hooks/use-toast";
import { LOGIN_PATH } from "@/constants/auth";
import type { SignupRequest, SignupResponse } from "@/features/auth/lib/dto";
import { AUTH_SIGNUP_API_PATH } from "@/features/auth/constants";

const SIGNUP_ERROR_FALLBACK = "회원가입 처리 중 문제가 발생했습니다.";

const postSignup = async (data: SignupRequest): Promise<SignupResponse> => {
  const response = await apiClient.post<SignupResponse>(AUTH_SIGNUP_API_PATH, {
    name: data.name,
    phone: data.phone,
    email: data.email,
    password: data.password,
    confirmPassword: data.confirmPassword,
    role: data.role,
    acceptedTermsTypes: data.acceptedTermsTypes,
  });
  return response.data;
};

export const useSignupMutation = () => {
  const router = useRouter();
  const { toast } = useToast();

  return useMutation({
    mutationFn: postSignup,
    onSuccess: (data) => {
      toast({
        title: "회원가입 완료",
        description: "로그인 후 서비스를 이용해 주세요.",
      });
      const target = data.redirectTo ?? LOGIN_PATH;
      router.replace(target);
    },
    onError: (error: unknown) => {
      const message = extractApiErrorMessage(error, SIGNUP_ERROR_FALLBACK);
      toast({
        variant: "destructive",
        title: "회원가입 실패",
        description: message,
      });
    },
  });
};
