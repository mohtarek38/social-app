import z from "zod";
import { GenderEnum, VALIDATION_RULES } from "../../Common/common.barrel";

export const updateProfileValidator = {
  body: z
    .strictObject({
      firstName: z.string().min(VALIDATION_RULES.firstName.min).max(VALIDATION_RULES.firstName.max).optional(),
      lastName: z.string().min(VALIDATION_RULES.lastName.min).max(VALIDATION_RULES.lastName.max).optional(),
      gender: z.enum(GenderEnum).optional(),
      DOB: z.coerce.date().optional(),
      phoneNumber: z.string().min(VALIDATION_RULES.phoneNumber.min).max(VALIDATION_RULES.phoneNumber.max).optional(),
      password: z.string().min(VALIDATION_RULES.password.min).max(VALIDATION_RULES.password.max).optional(),
      currentPassword: z.string().optional(),
    })
    .refine((data) => !data.DOB || new Date(data.DOB).getFullYear() >= VALIDATION_RULES.DOB.minYear, {
      path: ["DOB"],
      message: "Invalid year of birth",
    })
    .refine((data) => !data.password || data.currentPassword, {
      path: ["currentPassword"],
      message: "Current password is required when changing password",
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
};

export const friendRequestValidator = {
  query: z.strictObject({
    status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]),
  }),
};

export const respondToFriendshipValidator = {
  body: z.strictObject({
    requestId: z.string().min(1, "Request ID is required"),
    action: z.enum(["ACCEPTED", "REJECTED"]),
  }),
};