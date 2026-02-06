export const authErrorCodes = {
  emailAlreadyExists: "EMAIL_ALREADY_EXISTS",
  validationError: "VALIDATION_ERROR",
  profileCreateFailed: "PROFILE_CREATE_FAILED",
  termsSaveFailed: "TERMS_SAVE_FAILED",
  authCreateFailed: "AUTH_CREATE_FAILED",
} as const;

type AuthErrorValue = (typeof authErrorCodes)[keyof typeof authErrorCodes];

export type AuthServiceError = AuthErrorValue;
