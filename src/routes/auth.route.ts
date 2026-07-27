import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import ValidatorMiddleware from '../middlewares/validators/ValidatorMiddleware';
import AccessTokenValidator from '../services/accessTokenValidator.service';
import { validateToken } from '../services/token.service';
import { USER_ROLES } from '../types/consts';
import {
  SignupDto,
  LoginDto,
  RefreshTokenDto,
  UpdatePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from '../types-server/auth';

const authRouter = Router();

authRouter.post('/signup', ValidatorMiddleware.validateBody(SignupDto), authController.signup);
authRouter.post('/login', ValidatorMiddleware.validateBody(LoginDto), authController.login);
authRouter.post('/refresh', ValidatorMiddleware.validateBody(RefreshTokenDto), authController.refresh);
authRouter.post('/logout', ValidatorMiddleware.validateBody(RefreshTokenDto), authController.logout);
authRouter.post('/forgot-password', ValidatorMiddleware.validateBody(ForgotPasswordDto), authController.forgotPassword);
authRouter.post('/reset-password', ValidatorMiddleware.validateBody(ResetPasswordDto), authController.resetPassword);

authRouter.patch(
  '/password',
  validateToken,
  AccessTokenValidator.hasRole([USER_ROLES.ADMIN, USER_ROLES.CLIENT]),
  ValidatorMiddleware.validateBody(UpdatePasswordDto),
  authController.updatePassword,
);

authRouter.get(
  '/me',
  validateToken,
  AccessTokenValidator.hasRole([USER_ROLES.ADMIN, USER_ROLES.CLIENT]),
  authController.me,
);

authRouter.patch(
  '/me',
  validateToken,
  AccessTokenValidator.hasRole([USER_ROLES.ADMIN, USER_ROLES.CLIENT]),
  ValidatorMiddleware.validateBody(UpdateProfileDto),
  authController.updateProfile,
);

export default authRouter;
