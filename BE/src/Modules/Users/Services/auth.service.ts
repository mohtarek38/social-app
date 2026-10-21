import { NextFunction, Request, Response } from "express";
import { randomInt } from "crypto";
import { v4 as uuidv4 } from "uuid";

import { UserRepository, BlackListedTokensRepository } from "../../../DB/Repositories/repository.barrel";
import { UserModel, BlackListedTokensModel } from "../../../DB/Models/models.barrel";
import {
  encrypt,
  decrypt,
  generateHash,
  compareHash,
  emitter,
  verifyToken,
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "../../../Utils/utils.barrel";
import { ILoggedInRequest, IUser } from "../../../Common/Interfaces/user.interface";
import { otpTypesEnum, emailTemplates, SignUpBodyType } from "../../../Common/common.barrel";
import { generateToken } from "../../../Utils/Encryption/token.utils";
import { SignOptions } from "jsonwebtoken";
import { SuccessResponse } from "../../../Utils/Responses/response-helper.utils";

class AuthService {
  private userRepo: UserRepository = new UserRepository(UserModel);
  private blackListedTokenRepo = new BlackListedTokensRepository(BlackListedTokensModel);

  // Generate access and refresh tokens for a user
  private generateTokens = (user: IUser) => {
    const payload = { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, provider: user.provider, role: user.role };
    // Generate JWT access token
    const accesstoken = generateToken(payload, process.env.JWT_ACCESS_SECRET as string, {
      expiresIn: process.env.JWT_ACCESS_EXPIRATION as SignOptions["expiresIn"],
      jwtid: uuidv4(),
    });
    // Generate JWT refresh token
    const refreshtoken = generateToken(payload, process.env.JWT_REFRESH_SECRET as string, {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION as SignOptions["expiresIn"],
      jwtid: uuidv4(),
    });
    return { accesstoken, refreshtoken };
  };

  // Check that the user has a valid (not expired) OTP of the given type
  private isValidOtp = (user: IUser, otp: string, type: otpTypesEnum): boolean => {
    const savedOtp = user.otps?.find((item) => item.type === type && new Date(item.expiresAt).getTime() > Date.now());
    return !!savedOtp && compareHash(otp, savedOtp.value);
  };

  signUp = async (req: Request, res: Response) => {
    const { firstName, lastName, email, gender, password, phoneNumber, DOB }: SignUpBodyType = req.body;

    const isEmailExist = await this.userRepo.isEmailExists(email as string);
    if (isEmailExist) {
      throw new ConflictException("Email already exists", { invalidEmail: email });
    }
    // Generate OTP for email confirmation
    const otp = String(randomInt(100000, 999999));
    const confirmationOtp = {
      value: generateHash(otp),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Default expiry time: 10 minutes
      type: otpTypesEnum.CONFIRMATION,
    };
    // Create new user
    const newUser = await this.userRepo.createNewDocument({
      firstName,
      lastName,
      email,
      password: generateHash(password as string), // Hash Password
      gender,
      DOB,
      phoneNumber: encrypt(phoneNumber as string), // Encrypt phone number
      otps: [confirmationOtp],
    });

    // Send Email for registered user
    emitter.emit("sendEmail", {
      to: email,
      subject: "Confirmation Email for Sign Up",
      // content: emailTemplates.confirmationEmail(firstName as string, lastName as string, otp),
      content:`Email sent to ${email} with OTP: ${otp}`,
    });
    // Don't send the password hash and OTPs back to the client
    const { password: _password, otps: _otps, ...userData } = newUser.toObject();
    return res.status(201).json(SuccessResponse("User registered successfully.", 201, userData));
  };

  SignIn = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user: IUser | null = await this.userRepo.findOneDocument({ email });
    if (!user) {
      throw new UnauthorizedException("Email/Password is incorrect");
    }
    if (user.isDeleted) {
      throw new UnauthorizedException("Your account has been deleted");
    }
    const isPasswordValid = compareHash(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Email/Password is incorrect");
    }
    const { accesstoken, refreshtoken } = this.generateTokens(user);
    return res.status(200).json({ message: "Signed in successfully", data: { tokens: { accesstoken, refreshtoken } } });
  };

  SignOut = async (req: Request, res: Response) => {
    const {
      user: { _id },
      token: { jti, exp },
    } = (req as ILoggedInRequest).loggedInUser;

    const blackListedToken = await this.blackListedTokenRepo.createNewDocument({
      tokenId: jti as string,
      expiresAt: new Date((exp as number) * 1000),
      userId: _id,
    });
    return res.status(200).json({ message: "Signed out successfully", data: blackListedToken });
  };

  ConfirmEmail = async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    const user: IUser | null = await this.userRepo.findOneDocument({ email, isDeleted: false });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (user.isVerified) {
      throw new BadRequestException("Email is already confirmed");
    }
    if (!this.isValidOtp(user, otp, otpTypesEnum.CONFIRMATION)) {
      throw new BadRequestException("Invalid or expired OTP");
    }
    await this.userRepo.findAndUpdateDocument(user._id, {
      isVerified: true,
      $pull: { otps: { type: otpTypesEnum.CONFIRMATION } },
    } as any);
    return res.status(200).json(SuccessResponse("Email confirmed successfully", 200));
  };

  RefreshToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const decodedData = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET as string);

    const isBlackListed = await this.blackListedTokenRepo.findOneDocument({ tokenId: decodedData.jti });
    if (isBlackListed) {
      throw new UnauthorizedException("Your session is expired, Please login again");
    }
    const user: IUser | null = await this.userRepo.findUserByIdSafely(decodedData._id);
    if (!user || user.isDeleted) {
      throw new UnauthorizedException("User not found");
    }
    // Blacklist the used refresh token so it can't be used again
    await this.blackListedTokenRepo.createNewDocument({
      tokenId: decodedData.jti as string,
      expiresAt: new Date((decodedData.exp as number) * 1000),
      userId: user._id,
    });
    const tokens = this.generateTokens(user);
    return res.status(200).json(SuccessResponse("Tokens refreshed successfully", 200, { tokens }));
  };

  ForgetPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    const user: IUser | null = await this.userRepo.findOneDocument({ email, isDeleted: false });
    // Same response whether the email exists or not, so emails can not be discovered
    if (user) {
      const otp = String(randomInt(100000, 999999));
      const resetOtp = {
        value: generateHash(otp),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        type: otpTypesEnum.RESET_PASSWORD,
      };
      // Replace any old reset OTP with the new one
      const otps = (user.otps ?? []).filter((item) => item.type !== otpTypesEnum.RESET_PASSWORD);
      await this.userRepo.findAndUpdateDocument(user._id, { otps: [...otps, resetOtp] });

      emitter.emit("sendEmail", {
        to: email,
        subject: "Reset Password",
        content: `Email sent to ${email} with reset password OTP: ${otp}`,
      });
    }
    return res.status(200).json(SuccessResponse("If this email exists, a reset OTP has been sent", 200));
  };

  ResetPassword = async (req: Request, res: Response) => {
    const { email, otp, password } = req.body;
    const user: IUser | null = await this.userRepo.findOneDocument({ email, isDeleted: false });
    if (!user || !this.isValidOtp(user, otp, otpTypesEnum.RESET_PASSWORD)) {
      throw new BadRequestException("Invalid or expired OTP");
    }
    await this.userRepo.findAndUpdateDocument(user._id, {
      password: generateHash(password),
      $pull: { otps: { type: otpTypesEnum.RESET_PASSWORD } },
    } as any);
    return res.status(200).json(SuccessResponse("Password reset successfully", 200));
  };

}

export default new AuthService();
