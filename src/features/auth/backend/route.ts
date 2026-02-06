import type { Hono } from "hono";
import {
  failure,
  respond,
  type ErrorResult,
} from "@/backend/http/response";
import { getLogger, getSupabase, type AppEnv } from "@/backend/hono/context";
import { SignupRequestSchema } from "@/features/auth/backend/schema";
import { createAccountWithProfile } from "@/features/auth/backend/service";
import {
  authErrorCodes,
  type AuthServiceError,
} from "@/features/auth/backend/error";

export const registerAuthRoutes = (app: Hono<AppEnv>) => {
  app.post("/api/auth/signup", async (c) => {
    const bodyResult = SignupRequestSchema.safeParse(await c.req.json());

    if (!bodyResult.success) {
      return respond(
        c,
        failure(
          400,
          authErrorCodes.validationError,
          "입력값을 확인해 주세요.",
          bodyResult.error.flatten()
        )
      );
    }

    const body = bodyResult.data;
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const payload = {
      name: body.name,
      phone: body.phone,
      email: body.email,
      password: body.password,
      role: body.role,
      acceptedTermsTypes: body.acceptedTermsTypes,
    };

    const result = await createAccountWithProfile(supabase, payload);

    if (!result.ok) {
      const errorResult = result as ErrorResult<AuthServiceError, unknown>;
      if (errorResult.error.code === authErrorCodes.emailAlreadyExists) {
        logger.warn("Signup attempt with existing email", body.email);
      }
      if (errorResult.error.code === authErrorCodes.profileCreateFailed) {
        logger.error("Profile create failed after auth", errorResult.error.message);
      }
      return respond(c, result);
    }

    return respond(c, result);
  });
};
