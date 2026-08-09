import { Router } from 'express';
import * as siteSettingsController from '../controllers/siteSettings.controller';
import ValidatorMiddleware from '../middlewares/validators/ValidatorMiddleware';
import AccessTokenValidator from '../services/accessTokenValidator.service';
import { attachUserIfPresent, validateToken } from '../services/token.service';
import { siteSettingsImageUpload } from '../services/upload.service';
import { USER_ROLES } from '../types/consts';
import { UpdateSiteSettingsDto, StrengthItemDto, DecorItemDto, ItemIdParamDto } from '../types-server/siteSettings';

const siteSettingsRouter = Router();
// Rendering the home page is public; every write (text, section items, images) is ADMIN-only.
const WRITE_ROLES = [USER_ROLES.ADMIN];

siteSettingsRouter.get('/', attachUserIfPresent, siteSettingsController.getPublic);

siteSettingsRouter.patch(
  '/',
  validateToken,
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateBody(UpdateSiteSettingsDto),
  siteSettingsController.update,
);

siteSettingsRouter.post(
  '/hero/main-image',
  validateToken,
  AccessTokenValidator.hasRole(WRITE_ROLES),
  siteSettingsImageUpload.single('image'),
  siteSettingsController.setHeroMainImage,
);
siteSettingsRouter.post(
  '/hero/accent-image',
  validateToken,
  AccessTokenValidator.hasRole(WRITE_ROLES),
  siteSettingsImageUpload.single('image'),
  siteSettingsController.setHeroAccentImage,
);

siteSettingsRouter.post(
  '/strengths',
  validateToken,
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateBody(StrengthItemDto),
  siteSettingsController.addStrength,
);
siteSettingsRouter.patch(
  '/strengths/:itemId',
  validateToken,
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(ItemIdParamDto),
  ValidatorMiddleware.validateBody(StrengthItemDto),
  siteSettingsController.updateStrength,
);
siteSettingsRouter.delete(
  '/strengths/:itemId',
  validateToken,
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(ItemIdParamDto),
  siteSettingsController.removeStrength,
);

siteSettingsRouter.post(
  '/decors',
  validateToken,
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateBody(DecorItemDto),
  siteSettingsController.addDecor,
);
siteSettingsRouter.patch(
  '/decors/:itemId',
  validateToken,
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(ItemIdParamDto),
  ValidatorMiddleware.validateBody(DecorItemDto),
  siteSettingsController.updateDecor,
);
siteSettingsRouter.delete(
  '/decors/:itemId',
  validateToken,
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(ItemIdParamDto),
  siteSettingsController.removeDecor,
);
siteSettingsRouter.post(
  '/decors/:itemId/image',
  validateToken,
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(ItemIdParamDto),
  siteSettingsImageUpload.single('image'),
  siteSettingsController.setDecorImage,
);

export default siteSettingsRouter;
