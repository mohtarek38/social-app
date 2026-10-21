import z from "zod";
import { GenderEnum, VALIDATION_RULES } from "../../Common/common.barrel";

export const signUpValidator = {
  // firstName, lastName, email, password, gender, DOB, phoneNumber
  body: z
    .strictObject({
      firstName: z.string().min(VALIDATION_RULES.firstName.min).max(VALIDATION_RULES.firstName.max).optional(),
      lastName: z.string().min(VALIDATION_RULES.lastName.min).max(VALIDATION_RULES.lastName.max).optional(),
      email: z.email(),
      password: z.string().min(VALIDATION_RULES.password.min).max(VALIDATION_RULES.password.max),
      passwordConfirmation: z.string(),
      gender: z.enum(GenderEnum),
      DOB: z.coerce.date(),
      phoneNumber: z.string().min(VALIDATION_RULES.phoneNumber.min).max(VALIDATION_RULES.phoneNumber.max),
    })
    .refine(
      (data) => {
        if (data.password !== data.passwordConfirmation) return false;
        return true;
      },
      { path: ["passwordConfirmation"], message: "Passwords do not match" }
    ).refine(
      (data) => !data.DOB || new Date(data.DOB).getFullYear() >= VALIDATION_RULES.DOB.minYear,
      { path: ["DOB"], message: "Invalid year of birth" }
    ),
};

export const confirmEmailValidator = {
  body: z.strictObject({
    email: z.email(),
    otp: z.string().length(6, "OTP must be 6 digits"),
  }),
};

export const refreshTokenValidator = {
  body: z.strictObject({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
};

export const forgetPasswordValidator = {
  body: z.strictObject({
    email: z.email(),
  }),
};

export const resetPasswordValidator = {
  body: z
    .strictObject({
      email: z.email(),
      otp: z.string().length(6, "OTP must be 6 digits"),
      password: z.string().min(VALIDATION_RULES.password.min).max(VALIDATION_RULES.password.max),
      passwordConfirmation: z.string(),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
      path: ["passwordConfirmation"],
      message: "Passwords do not match",
    }),
};
