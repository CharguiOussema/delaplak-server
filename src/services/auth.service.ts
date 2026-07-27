import { v4 as uuidv4 } from 'uuid';
import { UnauthorizedError, BadRequestError, DuplicatedError } from '../errors';
import { userRepository, refreshTokenRepository } from '../repositories';
import * as bcryptService from './bcrypt.service';
import * as tokenService from './token.service';
import { mailerService } from './mailer.service';
import { USER_ROLES } from '../types/consts';
import { UserDocument } from '../models/user.model';
import { ENV, isInTestMode } from '../config';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

async function issueTokenPair(user: UserDocument, family: string): Promise<TokenPair> {
  const accessToken = await tokenService.generateAccessToken(user._id.toString());
  const refreshTokenValue = tokenService.generateRefreshTokenValue();
  const expiresAt = tokenService.getRefreshTokenExpiry();

  await refreshTokenRepository.create({
    tokenHash: tokenService.hashToken(refreshTokenValue),
    user: user._id,
    family,
    expiresAt,
  } as any);

  return { accessToken, refreshToken: refreshTokenValue, refreshTokenExpiresAt: expiresAt };
}

export async function signup({ email, password }: { email: string; password: string }) {
  const existing = await userRepository.getOne({ email: email.toLowerCase(), isDeleted: false }).lean();
  if (existing) {
    throw new DuplicatedError('Email already registered', 'auth.service.signup');
  }

  const passwordHash = await bcryptService.hash(password);
  const user = await userRepository.create({
    email: email.toLowerCase(),
    passwordHash,
    role: USER_ROLES.CLIENT,
  } as any);

  mailerService.sendWelcomeEmail(user.email, user.preferredLanguage, { name: user.email }).catch((err: unknown) => {
    if (!isInTestMode) console.error('[auth.service] failed to send welcome email', err);
  });

  const tokens = await issueTokenPair(user, uuidv4());
  return { user, tokens };
}

export async function login({ email, password }: { email: string; password: string }) {
  const user = await userRepository.getOne({ email: email.toLowerCase(), isDeleted: false });
  if (!user || !user.isActive) {
    throw new UnauthorizedError('Invalid credentials', 'auth.service.login');
  }

  const matches = await bcryptService.compare(password, user.passwordHash);
  if (!matches) {
    throw new UnauthorizedError('Invalid credentials', 'auth.service.login');
  }

  const tokens = await issueTokenPair(user, uuidv4());
  return { user, tokens };
}

export async function refresh({ refreshTokenValue }: { refreshTokenValue: string }) {
  if (!refreshTokenValue) {
    throw new UnauthorizedError('Missing refresh token', 'auth.service.refresh');
  }

  const tokenHash = tokenService.hashToken(refreshTokenValue);
  const existing = await refreshTokenRepository.getOne({ tokenHash });

  if (!existing) {
    throw new UnauthorizedError('Invalid refresh token', 'auth.service.refresh');
  }

  if (existing.expiresAt.getTime() < Date.now()) {
    throw new UnauthorizedError('Refresh token expired', 'auth.service.refresh');
  }

  if (existing.revokedAt) {
    // Reuse detected: someone presented an already-rotated/revoked token — this means
    // a refresh token was stolen/replayed. Nuke the whole family (every token descended
    // from that one login) and force the user to log in again everywhere.
    await refreshTokenRepository.revokeFamily(existing.family);
    throw new UnauthorizedError('Refresh token reuse detected — all sessions revoked', 'auth.service.refresh');
  }

  const user = await userRepository.getOne({ _id: existing.user, isDeleted: false });
  if (!user || !user.isActive) {
    throw new UnauthorizedError('User not found', 'auth.service.refresh');
  }

  const newRefreshTokenValue = tokenService.generateRefreshTokenValue();
  const newExpiresAt = tokenService.getRefreshTokenExpiry();
  const newTokenHash = tokenService.hashToken(newRefreshTokenValue);

  await refreshTokenRepository.create({
    tokenHash: newTokenHash,
    user: user._id,
    family: existing.family,
    expiresAt: newExpiresAt,
  } as any);

  existing.revokedAt = new Date();
  existing.replacedByTokenHash = newTokenHash;
  await existing.save();

  const accessToken = await tokenService.generateAccessToken(user._id.toString());

  return {
    user,
    tokens: { accessToken, refreshToken: newRefreshTokenValue, refreshTokenExpiresAt: newExpiresAt } as TokenPair,
  };
}

export async function logout({ refreshTokenValue }: { refreshTokenValue?: string }) {
  if (!refreshTokenValue) return;
  const tokenHash = tokenService.hashToken(refreshTokenValue);
  const existing = await refreshTokenRepository.getOne({ tokenHash });
  if (existing && !existing.revokedAt) {
    existing.revokedAt = new Date();
    await existing.save();
  }
}

export async function updatePassword({
  user,
  currentPassword,
  newPassword,
}: {
  user: UserDocument;
  currentPassword: string;
  newPassword: string;
}) {
  const fullUser = await userRepository.getOne({ _id: user._id, isDeleted: false });
  if (!fullUser) {
    throw new UnauthorizedError('User not found', 'auth.service.updatePassword');
  }

  const matches = await bcryptService.compare(currentPassword, fullUser.passwordHash);
  if (!matches) {
    throw new BadRequestError('Current password is incorrect', 'auth.service.updatePassword');
  }

  fullUser.passwordHash = await bcryptService.hash(newPassword);
  await fullUser.save();

  // Force re-login everywhere: revoke every refresh token (every family) for this user.
  await refreshTokenRepository.revokeAllForUser(fullUser._id.toString());

  return fullUser;
}

export async function updateProfile({
  user,
  payload,
}: {
  user: UserDocument;
  payload: { email?: string; preferredLanguage?: string };
}) {
  const fullUser = await userRepository.getOne({ _id: user._id, isDeleted: false });
  if (!fullUser) {
    throw new UnauthorizedError('User not found', 'auth.service.updateProfile');
  }

  if (payload.email && payload.email.toLowerCase() !== fullUser.email) {
    const existing = await userRepository
      .getOne({ email: payload.email.toLowerCase(), isDeleted: false, _id: { $ne: fullUser._id } })
      .lean();
    if (existing) {
      throw new DuplicatedError('Email already registered', 'auth.service.updateProfile');
    }
    fullUser.email = payload.email.toLowerCase();
  }

  if (payload.preferredLanguage) {
    fullUser.preferredLanguage = payload.preferredLanguage as UserDocument['preferredLanguage'];
  }

  await fullUser.save();
  return fullUser;
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

export async function forgotPassword({ email }: { email: string }) {
  const user = await userRepository.getOne({ email: email.toLowerCase(), isDeleted: false });
  // Always resolve without revealing whether the email exists — avoids user enumeration.
  if (!user) return;

  const resetToken = tokenService.generateRefreshTokenValue();
  user.passwordResetTokenHash = tokenService.hashToken(resetToken);
  user.passwordResetExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save();

  const resetUrl = `${ENV.CRM_PATH.replace(/\/api$/, '')}/reset-password?token=${resetToken}`;
  mailerService.sendPasswordResetEmail(user.email, resetUrl).catch((err: unknown) => {
    if (!isInTestMode) console.error('[auth.service] failed to send password reset email', err);
  });
}

export async function resetPassword({ token, newPassword }: { token: string; newPassword: string }) {
  const tokenHash = tokenService.hashToken(token);
  const user = await userRepository.getOne({
    passwordResetTokenHash: tokenHash,
    isDeleted: false,
  });

  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
    throw new BadRequestError('Invalid or expired reset token', 'auth.service.resetPassword');
  }

  user.passwordHash = await bcryptService.hash(newPassword);
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await user.save();

  await refreshTokenRepository.revokeAllForUser(user._id.toString());
}
