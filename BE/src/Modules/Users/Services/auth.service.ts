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
  ConflictException,
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
    return res.status(201).json(SuccessResponse("User registered successfully.", 201, newUser));
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
    // Generate JWT access token
    const accesstoken = generateToken(
      { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, provider: user.provider, role: user.role },
      process.env.JWT_ACCESS_SECRET as string,
      {
        expiresIn: process.env.JWT_ACCESS_EXPIRATION as SignOptions["expiresIn"],
        jwtid: uuidv4(),
      }
    );
    // Generate JWT refresh token
    const refreshtoken = generateToken(
      { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, provider: user.provider, role: user.role },
      process.env.JWT_REFRESH_SECRET as string,
      {
        expiresIn: process.env.JWT_ACCESS_EXPIRATION as SignOptions["expiresIn"],
        jwtid: uuidv4(),
      }
    );
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

}

export default new AuthService();
