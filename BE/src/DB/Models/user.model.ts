import mongoose from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum, VALIDATION_RULES, otpTypesEnum } from "../../Common/common.barrel";
import { IUser } from "../../Common/Interfaces/user.interface";
import { encrypt, generateHash, decrypt } from "../../Utils/utils.barrel";

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      minlength: [VALIDATION_RULES.firstName.min, `First name must be at least ${VALIDATION_RULES.firstName.min} characters long`],
      maxlength: [VALIDATION_RULES.firstName.max, `First name cannot exceed ${VALIDATION_RULES.firstName.max} characters`],
    },
    lastName: {
      type: String,
      required: true,
      minlength: [VALIDATION_RULES.lastName.min, `First name must be at least ${VALIDATION_RULES.lastName.min} characters long`],
      maxlength: [VALIDATION_RULES.lastName.max, `First name cannot exceed ${VALIDATION_RULES.lastName.max} characters`],
    },
    email: {
      type: String,
      required: true,
      index: {
        unique: true,
        name: "idx_email_unique",
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      // Google users don't have a password
      required: function (this: IUser) {
        return this.provider !== ProviderEnum.GOOGLE;
      },
    },
    role: {
      type: String,
      enum: RoleEnum,
      default: RoleEnum.USER,
    },
    gender: {
      type: String,
      enum: GenderEnum,
      default: GenderEnum.OTHER,
    },
    DOB: Date,
    profilePicture: String,
    coverPicture: String,
    provider: {
      type: String,
      enum: ProviderEnum,
      default: ProviderEnum.LOCAL,
    },
    googleId: String,
    phoneNumber: {
      type: String,
    },
    otps: [
      {
        value: { type: String, required: true },
        expiresAt: { type: Date, default: () => Date.now() + 10 * 60 * 1000 }, // Default expiry time: 10 minutes
        type: { type: String, enum: otpTypesEnum, required: true },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.set("toJSON", { virtuals: true });
// Date is in YYYY-MM-DD format
userSchema.virtual("age").get(function () {
  if (this.DOB) {
    const ageDifMs = Date.now() - this.DOB.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }
  return null;
});

const UserModel = mongoose.model<IUser>("User", userSchema);
export { UserModel };
