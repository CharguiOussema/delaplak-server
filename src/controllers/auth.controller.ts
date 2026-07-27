import { Response } from 'express';
import * as authService from '../services/auth.service';
import { userToResponseDTO } from '../helpers';
import { STATUS_CODE } from '../types/consts';
import { ENV, isInProductionMode } from '../config';
import { RequestWithBody } from '../utils/express';
import {
  SignupDto,
  LoginDto,
  RefreshTokenDto,
  UpdatePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from '../types-server/auth';
import { TokenPair } from '../services/auth.service';

const REFRESH_COOKIE_PATH = '/api/auth';

function setRefreshCookie(res: Response, tokens: TokenPair) {
  res.cookie(ENV.REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, {
    httpOnly: true,
    secure: isInProductionMode,
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    expires: tokens.refreshTokenExpiresAt,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(ENV.REFRESH_TOKEN_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}

// Both web (httpOnly cookie) and mobile (JSON body, since mobile clients can't read
// httpOnly cookies) get the refresh token — dual delivery, per deviation 4.
function sendAuthResponse(res: Response, status: number, user: any, tokens: TokenPair) {
  setRefreshCookie(res, tokens);
  res.status(status).send({
    user: userToResponseDTO(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
}

function resolveRefreshTokenValue(req: RequestWithBody<{ refreshToken?: string }>): string | undefined {
  return req.cookies?.[ENV.REFRESH_TOKEN_COOKIE_NAME] || req.body?.refreshToken;
}

export async function signup(req: RequestWithBody<SignupDto>, res: Response) {
  const { user, tokens } = await authService.signup(req.body);
  sendAuthResponse(res, STATUS_CODE.OK, user, tokens);
}

export async function login(req: RequestWithBody<LoginDto>, res: Response) {
  const { user, tokens } = await authService.login(req.body);
  sendAuthResponse(res, STATUS_CODE.OK, user, tokens);
}

export async function refresh(req: RequestWithBody<RefreshTokenDto>, res: Response) {
  const refreshTokenValue = resolveRefreshTokenValue(req);
  const { user, tokens } = await authService.refresh({ refreshTokenValue: refreshTokenValue as string });
  sendAuthResponse(res, STATUS_CODE.OK, user, tokens);
}

export async function logout(req: RequestWithBody<RefreshTokenDto>, res: Response) {
  const refreshTokenValue = resolveRefreshTokenValue(req);
  await authService.logout({ refreshTokenValue });
  clearRefreshCookie(res);
  res.status(STATUS_CODE.OK).send({ success: true });
}

export async function updatePassword(req: RequestWithBody<UpdatePasswordDto>, res: Response) {
  await authService.updatePassword({
    user: req.currentUser,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
  });
  clearRefreshCookie(res);
  res.status(STATUS_CODE.OK).send({ success: true });
}

export async function forgotPassword(req: RequestWithBody<ForgotPasswordDto>, res: Response) {
  await authService.forgotPassword(req.body);
  // Always 200, regardless of whether the email exists, to avoid user enumeration.
  res.status(STATUS_CODE.OK).send({ success: true });
}

export async function resetPassword(req: RequestWithBody<ResetPasswordDto>, res: Response) {
  await authService.resetPassword(req.body);
  res.status(STATUS_CODE.OK).send({ success: true });
}

export async function me(req: RequestWithBody<Record<string, never>>, res: Response) {
  res.status(STATUS_CODE.OK).send(userToResponseDTO(req.currentUser));
}

export async function updateProfile(req: RequestWithBody<UpdateProfileDto>, res: Response) {
  const user = await authService.updateProfile({ user: req.currentUser, payload: req.body });
  res.status(STATUS_CODE.OK).send(userToResponseDTO(user));
}
