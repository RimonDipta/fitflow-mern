import jwt, { JwtPayload, SignOptions, Secret } from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
  role: string;
  gymId?: string;
}

export interface VerifiedRefreshToken extends JwtPayload {
  userId: string;
  role: string;
  gymId?: string;
}

const getAccessSecret = (): Secret => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not defined");
  }

  return secret;
};

const getRefreshSecret = (): Secret => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not defined");
  }

  return secret;
};

const getAccessExpiresIn = (): SignOptions["expiresIn"] => {
  return (process.env.JWT_ACCESS_EXPIRES_IN ||
    "15m") as SignOptions["expiresIn"];
};

const getRefreshExpiresIn = (): SignOptions["expiresIn"] => {
  return (process.env.JWT_REFRESH_EXPIRES_IN ||
    "7d") as SignOptions["expiresIn"];
};

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: getAccessExpiresIn(),
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn: getRefreshExpiresIn(),
  });
};

export const verifyRefreshToken = (token: string): VerifiedRefreshToken => {
  return jwt.verify(token, getRefreshSecret()) as VerifiedRefreshToken;
};
