import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import ValidatorMiddleware from '../middlewares/validators/ValidatorMiddleware';
import AccessTokenValidator from '../services/accessTokenValidator.service';
import { attachUserIfPresent, validateToken } from '../services/token.service';
import { productImageUpload } from '../services/upload.service';
import { USER_ROLES } from '../types/consts';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, DeleteProductImageDto } from '../types-server/product';
import { IdParamDto } from '../types-server/common/idParam.dto';

const productRouter = Router();
// Browsing (list/detail/filter) is public so guests can view the catalog.
// Product CRUD stays ADMIN-only.
const WRITE_ROLES = [USER_ROLES.ADMIN];

productRouter.get('/filter', attachUserIfPresent, productController.filter);
productRouter.get('/', attachUserIfPresent, ValidatorMiddleware.validateQuery(ProductQueryDto), productController.getAll);
productRouter.get(
  '/:id',
  attachUserIfPresent,
  ValidatorMiddleware.validateParams(IdParamDto),
  productController.getById,
);
productRouter.post(
  '/',
  validateToken,
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateBody(CreateProductDto),
  productController.create,
);
productRouter.patch(
  '/:id',
  validateToken,
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  ValidatorMiddleware.validateBody(UpdateProductDto),
  productController.update,
);
productRouter.delete(
  '/:id',
  validateToken,
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  productController.remove,
);

productRouter.post(
  '/:id/images',
  validateToken,
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  productImageUpload.array('images', 10),
  productController.addImages,
);
productRouter.delete(
  '/:id/images',
  validateToken,
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  ValidatorMiddleware.validateBody(DeleteProductImageDto),
  productController.removeImage,
);

export default productRouter;
