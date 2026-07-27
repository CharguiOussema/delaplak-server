import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import ValidatorMiddleware from '../middlewares/validators/ValidatorMiddleware';
import AccessTokenValidator from '../services/accessTokenValidator.service';
import { validateToken } from '../services/token.service';
import { USER_ROLES } from '../types/consts';
import { CreateCategoryDto, UpdateCategoryDto } from '../types-server/category';
import { IdParamDto } from '../types-server/common/idParam.dto';
import { PaginationQueryValidator } from '../middlewares/validators/QueryValidator';

const categoryRouter = Router();
// Per the task's permission matrix: Category CRUD is ADMIN-only, browse is both roles.
const ALL_ROLES = [USER_ROLES.ADMIN, USER_ROLES.CLIENT];
const WRITE_ROLES = [USER_ROLES.ADMIN];

categoryRouter.use(validateToken);

categoryRouter.get('/tree', AccessTokenValidator.hasRole(ALL_ROLES), categoryController.tree);
categoryRouter.get('/filter', AccessTokenValidator.hasRole(ALL_ROLES), categoryController.filter);
categoryRouter.get(
  '/',
  AccessTokenValidator.hasRole(ALL_ROLES),
  ValidatorMiddleware.validateQuery(PaginationQueryValidator),
  categoryController.getAll,
);
categoryRouter.get(
  '/:id',
  AccessTokenValidator.hasRole(ALL_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  categoryController.getById,
);
categoryRouter.post(
  '/',
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateBody(CreateCategoryDto),
  categoryController.create,
);
categoryRouter.patch(
  '/:id',
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  ValidatorMiddleware.validateBody(UpdateCategoryDto),
  categoryController.update,
);
categoryRouter.delete(
  '/:id',
  AccessTokenValidator.hasRole(WRITE_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  categoryController.remove,
);

export default categoryRouter;
