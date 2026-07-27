import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import ValidatorMiddleware from '../middlewares/validators/ValidatorMiddleware';
import AccessTokenValidator from '../services/accessTokenValidator.service';
import { validateToken } from '../services/token.service';
import { USER_ROLES } from '../types/consts';
import { CreateUserDto, UpdateUserDto } from '../types-server/user';
import { IdParamDto } from '../types-server/common/idParam.dto';
import { PaginationQueryValidator } from '../middlewares/validators/QueryValidator';

const userRouter = Router();
const MANAGE_ROLES = [USER_ROLES.ADMIN];

userRouter.use(validateToken, AccessTokenValidator.hasRole(MANAGE_ROLES));

userRouter.get('/', ValidatorMiddleware.validateQuery(PaginationQueryValidator), userController.getAll);
userRouter.get('/:id', ValidatorMiddleware.validateParams(IdParamDto), userController.getById);
userRouter.post('/', ValidatorMiddleware.validateBody(CreateUserDto), userController.create);
userRouter.patch(
  '/:id',
  ValidatorMiddleware.validateParams(IdParamDto),
  ValidatorMiddleware.validateBody(UpdateUserDto),
  userController.update,
);
userRouter.patch('/:id/deactivate', ValidatorMiddleware.validateParams(IdParamDto), userController.deactivate);

export default userRouter;
