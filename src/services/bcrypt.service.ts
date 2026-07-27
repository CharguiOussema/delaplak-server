import * as bcrypt from 'bcryptjs';
import { ENV } from '../config';

/**
 * Password hashing only. Token generation/validation lives in `token.service.ts`
 * so the short-lived access token and the opaque refresh token can evolve independently.
 */
async function generateSalt() {
  return bcrypt.genSaltSync(ENV.SALTKEY);
}

export async function hash(password: string) {
  const salt = await generateSalt();
  return bcrypt.hashSync(password, salt);
}

export async function compare(plaintext: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hashed);
}
