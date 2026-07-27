import { Router } from 'express';
import * as invoiceController from '../controllers/invoice.controller';
import ValidatorMiddleware from '../middlewares/validators/ValidatorMiddleware';
import AccessTokenValidator from '../services/accessTokenValidator.service';
import { validateToken } from '../services/token.service';
import { USER_ROLES } from '../types/consts';
import { PaginationQueryValidator } from '../middlewares/validators/QueryValidator';
import { IdParamDto } from '../types-server/common/idParam.dto';

const invoiceRouter = Router();
// ADMIN can access any invoice; CLIENT only their own — ownership is enforced in
// invoice.service.ts for CLIENT callers.
const READ_ROLES = [USER_ROLES.ADMIN, USER_ROLES.CLIENT];

invoiceRouter.use(validateToken, AccessTokenValidator.hasRole(READ_ROLES));

invoiceRouter.get('/', ValidatorMiddleware.validateQuery(PaginationQueryValidator), invoiceController.getAll);
invoiceRouter.get('/:id', ValidatorMiddleware.validateParams(IdParamDto), invoiceController.getById);
invoiceRouter.get('/:id/pdf', ValidatorMiddleware.validateParams(IdParamDto), invoiceController.downloadPdf);

export default invoiceRouter;
