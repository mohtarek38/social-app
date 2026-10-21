import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { BadRequestException } from "../utils.barrel";

// Generate
export const generateToken = (payload: string | Buffer | object, secret: Secret, options?: SignOptions): string => {
  return jwt.sign(payload, secret, options);
};

// Verify
export const verifyToken = (token: string, secret: Secret, options?: SignOptions): JwtPayload => {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    throw new BadRequestException("Invalid token");
  }
};

// Google OAuth2 Client
const client = new OAuth2Client();
export const verifyGoogleToken = async (token: string) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};
