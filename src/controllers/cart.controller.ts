import { Response } from 'express';
import * as cartService from '../services/cart.service';
import { STATUS_CODE } from '../types/consts';
import { RequestWithBody, RequestWithParamsAndBody } from '../utils/express';
import { AddCartItemDto, SetCartItemQuantityDto, CartItemIdParamDto } from '../types-server/cart';

export async function getCart(req: RequestWithBody<Record<string, never>>, res: Response) {
  const cart = await cartService.getCart(req.currentUser._id.toString());
  res.status(STATUS_CODE.OK).send(cart);
}

export async function addItem(req: RequestWithBody<AddCartItemDto>, res: Response) {
  const cart = await cartService.addItem({
    clientId: req.currentUser._id.toString(),
    product: req.body.product,
    quantity: req.body.quantity,
    selectedOptions: req.body.selectedOptions,
  });
  res.status(STATUS_CODE.OK).send(cart);
}

export async function setItemQuantity(req: RequestWithParamsAndBody<CartItemIdParamDto, SetCartItemQuantityDto>, res: Response) {
  const cart = await cartService.setItemQuantity({
    clientId: req.currentUser._id.toString(),
    itemId: req.params.itemId,
    quantity: req.body.quantity,
  });
  res.status(STATUS_CODE.OK).send(cart);
}

export async function removeItem(req: RequestWithParamsAndBody<CartItemIdParamDto, Record<string, never>>, res: Response) {
  const cart = await cartService.removeItem({ clientId: req.currentUser._id.toString(), itemId: req.params.itemId });
  res.status(STATUS_CODE.OK).send(cart);
}

export async function clearCart(req: RequestWithBody<Record<string, never>>, res: Response) {
  const cart = await cartService.clearCart(req.currentUser._id.toString());
  res.status(STATUS_CODE.OK).send(cart);
}
