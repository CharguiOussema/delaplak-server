import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import ValidatorMiddleware from '../middlewares/validators/ValidatorMiddleware';
import AccessTokenValidator from '../services/accessTokenValidator.service';
import { validateToken } from '../services/token.service';
import { productImageUpload } from '../services/upload.service';
import { USER_ROLES } from '../types/consts';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, DeleteProductImageDto } from '../types-server/product';
import { IdParamDto } from '../types-server/common/idParam.dto';

const productRouter = Router();
// Per the task's permission matrix: Product CRUD is ADMIN-only, browse is both roles.
const ALL_ROLES = [USER_ROLES.ADMIN, USER_ROLES.CLIENT];
const WRITE_ROLES = [USER_ROLES.ADMIN];

productRouter.use(validateToken);

productRouter.get('/filter', AccessTokenValidator.hasRole(ALL_ROLES), productController.filter);
productRouter.get(
  '/',
  AccessTokenValidator.hasRole(ALL_ROLES),
  ValidatorMiddleware.validateQuery(ProductQueryDto),
  productController.getAll,
);
productRouter.get(
  '/:id',
  AccessTokenValidator.hasRole(ALL_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  productController.getById,
);
productRouter.post(
  '/',
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateBody(CreateProductDto),
  productController.create,
);
productRouter.patch(
  '/:id',
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  ValidatorMiddleware.validateBody(UpdateProductDto),
  productController.update,
);
productRouter.delete(
  '/:id',
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  productController.remove,
);

productRouter.post(
  '/:id/images',
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  productImageUpload.array('images', 10),
  productController.addImages,
);
productRouter.delete(
  '/:id/images',
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  ValidatorMiddleware.validateBody(DeleteProductImageDto),
  productController.removeImage,
);

export default productRouter;
