import { Response } from 'express';
import * as cartService from '../services/cart.service';
import { STATUS_CODE } from '../types/consts';
import { RequestWithBody, RequestWithParamsAndBody } from '../utils/express';
import { AddCartItemDto, SetCartItemQuantityDto, ProductIdParamDto } from '../types-server/cart';

export async function getCart(req: RequestWithBody<Record<string, never>>, res: Response) {
  const cart = await cartService.getCart(req.currentUser._id.toString());
  res.status(STATUS_CODE.OK).send(cart);
}

export async function addItem(req: RequestWithBody<AddCartItemDto>, res: Response) {
  const cart = await cartService.addItem({
    clientId: req.currentUser._id.toString(),
    product: req.body.product,
    quantity: req.body.quantity,
  });
  res.status(STATUS_CODE.OK).send(cart);
}

export async function setItemQuantity(req: RequestWithParamsAndBody<ProductIdParamDto, SetCartItemQuantityDto>, res: Response) {
  const cart = await cartService.setItemQuantity({
    clientId: req.currentUser._id.toString(),
    productId: req.params.productId,
    quantity: req.body.quantity,
  });
  res.status(STATUS_CODE.OK).send(cart);
}

export async function removeItem(req: RequestWithParamsAndBody<ProductIdParamDto, Record<string, never>>, res: Response) {
  const cart = await cartService.removeItem({ clientId: req.currentUser._id.toString(), productId: req.params.productId });
  res.status(STATUS_CODE.OK).send(cart);
}

export async function clearCart(req: RequestWithBody<Record<string, never>>, res: Response) {
  const cart = await cartService.clearCart(req.currentUser._id.toString());
  res.status(STATUS_CODE.OK).send(cart);
}
