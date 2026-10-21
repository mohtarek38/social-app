import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";

import { ILoggedInRequest, IUser } from "../Common/Interfaces/interface.barrel";
import { BadRequestException, UnauthorizedException, NotFoundException, verifyToken } from "../Utils/utils.barrel";
import { UserRepository, BlackListedTokensRepository } from "../DB/Repositories/repository.barrel";
import { UserModel, BlackListedTokensModel } from "../DB/Models/models.barrel";

const userRepo = new UserRepository(UserModel);
const blackListedTokenRepo = new BlackListedTokensRepository(BlackListedTokensModel);

export const AuthenticationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const { authorization: accesstoken } = req.headers;
  if (!accesstoken) {
    throw new BadRequestException("Please login first");
  }
  const [prefix, token] = accesstoken.split(" ");
  if (prefix !== process.env.JWT_PREFIX || !token) {
    throw new UnauthorizedException("Invalid token");
  }
  const decodedData = verifyToken(token, process.env.JWT_ACCESS_SECRET as string);
  if (!decodedData._id) {
    throw new UnauthorizedException("Invalid payload");
  }
  const user: IUser | null = await userRepo.findUserByIdSafely(decodedData._id);
  if (!user) {
    throw new NotFoundException("User not found");
  }
  if (user.isDeleted) {
    throw new UnauthorizedException("Account was deleted, Please contact support");
  }
  const isBlackListed = await blackListedTokenRepo.findOneDocument({ tokenId: decodedData.jti });
  if (isBlackListed) {
    throw new UnauthorizedException("Your session is expired, Please try again!");
  }
  (req as ILoggedInRequest).loggedInUser = { user, token: decodedData as JwtPayload };
  return next();
};
