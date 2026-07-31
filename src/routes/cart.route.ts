import { Router } from 'express';
import * as cartController from '../controllers/cart.controller';
import ValidatorMiddleware from '../middlewares/validators/ValidatorMiddleware';
import AccessTokenValidator from '../services/accessTokenValidator.service';
import { validateToken } from '../services/token.service';
import { USER_ROLES } from '../types/consts';
import { AddCartItemDto, SetCartItemQuantityDto, CartItemIdParamDto } from '../types-server/cart';

const cartRouter = Router();
const CLIENT_ONLY = [USER_ROLES.CLIENT];

cartRouter.use(validateToken, AccessTokenValidator.hasRole(CLIENT_ONLY));

cartRouter.get('/', cartController.getCart);
cartRouter.post('/items', ValidatorMiddleware.validateBody(AddCartItemDto), cartController.addItem);
cartRouter.patch(
  '/items/:itemId',
  ValidatorMiddleware.validateParams(CartItemIdParamDto),
  ValidatorMiddleware.validateBody(SetCartItemQuantityDto),
  cartController.setItemQuantity,
);
cartRouter.delete('/items/:itemId', ValidatorMiddleware.validateParams(CartItemIdParamDto), cartController.removeItem);
cartRouter.delete('/', cartController.clearCart);

export default cartRouter;
