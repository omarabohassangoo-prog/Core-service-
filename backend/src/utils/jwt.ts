import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

export interface JwtTokenPayload {
  sub: number;
  email: string;
}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export const signAccessToken = (payload: JwtTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const signRefreshToken = (payload: JwtTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  };
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, options);
};

export const verifyAccessToken = (token: string): JwtTokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as unknown as JwtTokenPayload;
};

export const verifyRefreshToken = (token: string): JwtTokenPayload => {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as unknown as JwtTokenPayload;
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
