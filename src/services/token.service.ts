import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { ENV } from '../config';
import { UnauthorizedError } from '../errors';
import { userRepository } from '../repositories';

const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function generateAccessToken(userId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign({ sub: userId }, ENV.SECRETKEY, { expiresIn: ACCESS_TOKEN_EXPIRY }, (err, token) => {
      if (err) reject(err);
      else resolve(token as string);
    });
  });
}

export function generateRefreshTokenValue(): string {
  return crypto.randomBytes(40).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getRefreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
}

/**
 * JWT auth middleware. Verifies the `Authorization: Bearer <token>` access token,
 * loads the user fresh from Mongo (no session cache), attaches as `req.currentUser`.
 * Mirrors ARCHITECTURE.md §2.8's `bcrypt.service.ts` `validateToken`, but the token is
 * now short-lived (15m) and generation lives here instead.
 */
export async function validateToken(req: Request, _: Response, next: NextFunction) {
  const data = req.headers.authorization || '';
  if (data.startsWith('Bearer ')) {
    const token = data.split(' ')[1];
    let payload: string | jwt.JwtPayload;
    try {
      payload = jwt.verify(token, ENV.SECRETKEY);
    } catch (error) {
      throw new UnauthorizedError('Invalid token', 'token.service validateToken', { token });
    }

    const sub = typeof payload === 'string' ? payload : payload.sub;
    const user = await userRepository.getOne({ _id: sub, isDeleted: false }).lean();

    if (!user || !user.isActive) {
      throw new UnauthorizedError('user not found', 'token.service validateToken', { user: payload });
    }
    req.currentUser = user as any;
    next();
  } else {
    throw new UnauthorizedError('Invalid token', 'token.service validateToken', { user: data });
  }
}
