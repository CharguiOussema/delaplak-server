import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import ValidatorMiddleware from '../middlewares/validators/ValidatorMiddleware';
import AccessTokenValidator from '../services/accessTokenValidator.service';
import { attachUserIfPresent, validateToken } from '../services/token.service';
import { USER_ROLES } from '../types/consts';
import { CreateCategoryDto, UpdateCategoryDto } from '../types-server/category';
import { IdParamDto } from '../types-server/common/idParam.dto';
import { PaginationQueryValidator } from '../middlewares/validators/QueryValidator';

const categoryRouter = Router();
// Browsing (tree/list/detail/filter) is public so guests can view categories.
// Category CRUD stays ADMIN-only.
const WRITE_ROLES = [USER_ROLES.ADMIN];

categoryRouter.get('/tree', attachUserIfPresent, categoryController.tree);
categoryRouter.get('/filter', attachUserIfPresent, categoryController.filter);
categoryRouter.get(
  '/',
  attachUserIfPresent,
  ValidatorMiddleware.validateQuery(PaginationQueryValidator),
  categoryController.getAll,
);
categoryRouter.get(
  '/:id',
  attachUserIfPresent,
  ValidatorMiddleware.validateParams(IdParamDto),
  categoryController.getById,
);
categoryRouter.post(
  '/',
  validateToken,
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateBody(CreateCategoryDto),
  categoryController.create,
);
categoryRouter.patch(
  '/:id',
  validateToken,
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  ValidatorMiddleware.validateBody(UpdateCategoryDto),
  categoryController.update,
);
categoryRouter.delete(
  '/:id',
  validateToken,
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  categoryController.remove,
);

export default categoryRouter;
