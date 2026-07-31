import { Router } from 'express';
import * as productAttributeController from '../controllers/productAttribute.controller';
import ValidatorMiddleware from '../middlewares/validators/ValidatorMiddleware';
import AccessTokenValidator from '../services/accessTokenValidator.service';
import { validateToken } from '../services/token.service';
import { USER_ROLES } from '../types/consts';
import {
  CreateProductAttributeDto,
  UpdateProductAttributeDto,
  AttributeOptionDto,
  OptionIdParamDto,
} from '../types-server/productAttribute';
import { IdParamDto } from '../types-server/common/idParam.dto';
import { PaginationQueryValidator } from '../middlewares/validators/QueryValidator';

const productAttributeRouter = Router();
// Settings vocabulary is admin-managed; browse (filter/getAll) is available to both roles
// so the client app and admin product form can both list attribute types/options.
const ALL_ROLES = [USER_ROLES.ADMIN, USER_ROLES.CLIENT];
const WRITE_ROLES = [USER_ROLES.ADMIN];

productAttributeRouter.use(validateToken);

productAttributeRouter.get('/filter', AccessTokenValidator.hasRole(ALL_ROLES), productAttributeController.filter);
productAttributeRouter.get(
  '/',
  AccessTokenValidator.hasRole(ALL_ROLES),
  ValidatorMiddleware.validateQuery(PaginationQueryValidator),
  productAttributeController.getAll,
);
productAttributeRouter.get(
  '/:id',
  AccessTokenValidator.hasRole(ALL_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  productAttributeController.getById,
);
productAttributeRouter.post(
  '/',
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateBody(CreateProductAttributeDto),
  productAttributeController.create,
);
productAttributeRouter.patch(
  '/:id',
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  ValidatorMiddleware.validateBody(UpdateProductAttributeDto),
  productAttributeController.update,
);
productAttributeRouter.delete(
  '/:id',
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  productAttributeController.remove,
);

productAttributeRouter.post(
  '/:id/options',
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  ValidatorMiddleware.validateBody(AttributeOptionDto),
  productAttributeController.addOption,
);
productAttributeRouter.patch(
  '/:id/options/:optionId',
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(OptionIdParamDto),
  ValidatorMiddleware.validateBody(AttributeOptionDto),
  productAttributeController.updateOption,
);
productAttributeRouter.delete(
  '/:id/options/:optionId',
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(OptionIdParamDto),
  productAttributeController.removeOption,
);

export default productAttributeRouter;
