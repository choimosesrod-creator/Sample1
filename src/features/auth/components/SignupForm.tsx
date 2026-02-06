"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOGIN_PATH } from "@/constants/auth";
import { SignupRequestSchema, type SignupRequest } from "@/features/auth/lib/dto";
import {
  APP_ROLE_LABELS,
  REQUIRED_TERMS_TYPES,
  TERMS_TYPE_LABELS,
} from "@/features/auth/constants";
import type { AppRole } from "@/constants/auth";
import { useSignupMutation } from "@/features/auth/hooks/useSignupMutation";

const DEFAULT_VALUES: Partial<SignupRequest> = {
  name: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "advertiser",
  acceptedTermsTypes: [],
};

const ROLE_OPTIONS = (Object.keys(APP_ROLE_LABELS) as AppRole[]).filter(
  (key): key is AppRole => key in APP_ROLE_LABELS
);

export function SignupForm() {
  const mutation = useSignupMutation();

  const form = useForm<SignupRequest>({
    resolver: zodResolver(SignupRequestSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = (data: SignupRequest) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4 rounded-xl border border-slate-200 p-6 shadow-sm"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이름</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  autoComplete="name"
                  placeholder="이름을 입력하세요"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>휴대폰 번호</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  autoComplete="tel"
                  placeholder="휴대폰 번호를 입력하세요"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이메일</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="이메일을 입력하세요"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="6자 이상 입력하세요"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호 확인</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="비밀번호를 다시 입력하세요"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>역할</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="역할을 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>
                      {APP_ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="acceptedTermsTypes"
          render={({ field }) => (
            <FormItem>
              <div className="mb-2 space-y-2">
                <FormLabel>약관 동의</FormLabel>
                <FormDescription>필수 약관에 동의해 주세요.</FormDescription>
              </div>
              {REQUIRED_TERMS_TYPES.map((termsType) => (
                <div
                  key={termsType}
                  className="flex flex-row items-center space-x-2 space-y-0"
                >
                  <FormControl>
                    <Checkbox
                      checked={field.value?.includes(termsType) ?? false}
                      onCheckedChange={(checked) => {
                        const next = checked
                          ? [...(field.value ?? []), termsType]
                          : (field.value ?? []).filter((t) => t !== termsType);
                        field.onChange(next);
                      }}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    {TERMS_TYPE_LABELS[termsType]}에 동의합니다.
                  </FormLabel>
                </div>
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {mutation.isPending ? "등록 중" : "회원가입"}
        </Button>
        <p className="text-xs text-slate-500">
          이미 계정이 있으신가요?{" "}
          <Link
            href={LOGIN_PATH}
            className="font-medium text-slate-700 underline hover:text-slate-900"
          >
            로그인으로 이동
          </Link>
        </p>
      </form>
    </Form>
  );
}
