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
// Cancel is readable by both: ADMIN can cancel any pending order, a CLIENT only their own
// (ownership enforced in order.service.ts, same pattern as getById).
const CANCEL_ROLES = [USER_ROLES.ADMIN, USER_ROLES.CLIENT];

orderRouter.use(validateToken);

orderRouter.post('/', AccessTokenValidator.hasRole(CLIENT_ONLY), orderController.create);
orderRouter.get('/', AccessTokenValidator.hasRole(READ_ROLES), ValidatorMiddleware.validateQuery(OrderQueryDto), orderController.getAll);
orderRouter.get(
  '/:id',
  AccessTokenValidator.hasRole(READ_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  orderController.getById,
);
// Confirmation is ADMIN-only (needs staff verification). Cancellation is ADMIN-or-owner
// (a client can back out of their own order before it's confirmed). Both are one-way:
// once an order leaves PENDING, neither route accepts it again (enforced in order.service.ts).
orderRouter.patch(
  '/:id/confirm',
  AccessTokenValidator.hasRole(ADMIN_ONLY),
  ValidatorMiddleware.validateParams(IdParamDto),
  orderController.confirm,
);
orderRouter.patch(
  '/:id/cancel',
  AccessTokenValidator.hasRole(CANCEL_ROLES),
  ValidatorMiddleware.validateParams(IdParamDto),
  orderController.cancel,
);

export default orderRouter;
