import { Document, Types } from "mongoose";
import { Request } from "express";
import { FriendShipStatusEnum, GenderEnum, ProviderEnum, RoleEnum, otpTypesEnum } from "../common.barrel";
import { JwtPayload } from "jsonwebtoken";

interface IOTP {
  value: string;
  expiresAt: Date;
  type: otpTypesEnum;
}

interface IEmailArguments {
  to: string;
  cc?: string;
  subject: string;
  content: string;
  attachments?: [];
}

interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  isVerified?: boolean;
  password: string;
  role?: RoleEnum;
  gender?: GenderEnum;
  DOB?: Date;
  profilePicture?: string;
  coverPicture?: string;
  provider?: ProviderEnum;
  googleId?: string;
  phoneNumber?: string;
  otps?: IOTP[];
  isDeleted?: boolean;
}

interface ILoggedInRequest extends Request {
  loggedInUser: { user: IUser; token: JwtPayload };
}

interface IBlackListedToken extends Document {
  tokenId: string;
  expiresAt: Date;
  userId?: string;
}

interface IFriendship extends Document {
  requestFromId: Types.ObjectId;
  requestToId: Types.ObjectId;
  status: FriendShipStatusEnum;
}

export { IUser, IOTP, ILoggedInRequest, IBlackListedToken, IEmailArguments, IFriendship };
