import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import ValidatorMiddleware from '../middlewares/validators/ValidatorMiddleware';
import AccessTokenValidator from '../services/accessTokenValidator.service';
import { validateToken } from '../services/token.service';
import { USER_ROLES } from '../types/consts';
import { OrderQueryDto } from '../types-server/order';
import { IdParamDto } from '../types-server/common/idParam.dto';

const orderRouter = Router();
const CLIENT_ONLY = [USER_ROLES.CLIENT];
const ADMIN_ONLY = [USER_ROLES.ADMIN];
// GET routes are readable by CLIENT (own orders only, enforced in the service) and ADMIN (all orders).
const READ_ROLES = [USER_ROLES.ADMIN, USER_ROLES.CLIENT];

orderRouter.use(validateToken);

orderRouter.post('/', AccessTokenValidator.hasRole(CLIENT_ONLY), orderController.create);
orderRouter.get('/', AccessTokenValidator.hasRole(READ_ROLES), ValidatorMiddleware.validateQuery(OrderQueryDto), orderController.getAll);
orderRouter.get(
  '/:id',
  AccessTokenValidator.hasRole(READ_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  orderController.getById,
);
// Order confirmation is ADMIN-only per the task's permission matrix.
orderRouter.patch(
  '/:id/confirm',
  AccessTokenValidator.hasRole(ADMIN_ONLY),
  ValidatorMiddleware.validateParams(IdParamDto),
  orderController.confirm,
);

export default orderRouter;
