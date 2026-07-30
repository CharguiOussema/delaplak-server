import { cartRepository, productRepository } from '../repositories';
import { NotFoundError, BadRequestError } from '../errors';
import { CartModel } from '../models/cart.model';

async function getOrCreate(clientId: string) {
  await cartRepository.getOrCreateForClient(clientId);
  const cart = await CartModel.findOne({ client: clientId }).populate('items.product');
  return cart!;
}

export async function getCart(clientId: string) {
  return getOrCreate(clientId);
}

function assertStockAvailable(productDoc: { stock: number; name: { en: string } }, requestedQuantity: number, functionName: string) {
  if (requestedQuantity > productDoc.stock) {
    throw new BadRequestError(
      `Insufficient stock for "${productDoc.name.en}": requested ${requestedQuantity}, available ${productDoc.stock}`,
      functionName,
    );
  }
}

export async function addItem({ clientId, product, quantity }: { clientId: string; product: string; quantity: number }) {
  const productDoc = await productRepository.getOne({ _id: product, isDeleted: false });
  if (!productDoc) {
    throw new NotFoundError('Product not found', 'cart.service.addItem');
  }

  await cartRepository.getOrCreateForClient(clientId);

  const existing = await CartModel.findOne({ client: clientId, 'items.product': product });
  const existingQuantity = existing?.items.find((item) => item.product.toString() === product)?.quantity ?? 0;
  assertStockAvailable(productDoc, existingQuantity + quantity, 'cart.service.addItem');

  if (existing) {
    await CartModel.updateOne({ client: clientId, 'items.product': product }, { $inc: { 'items.$.quantity': quantity } });
  } else {
    await CartModel.updateOne({ client: clientId }, { $push: { items: { product, quantity } } });
  }

  return getOrCreate(clientId);
}

export async function setItemQuantity({ clientId, productId, quantity }: { clientId: string; productId: string; quantity: number }) {
  const cart = await CartModel.findOne({ client: clientId, 'items.product': productId });
  if (!cart) {
    throw new NotFoundError('Item not found in cart', 'cart.service.setItemQuantity');
  }

  const productDoc = await productRepository.getOne({ _id: productId, isDeleted: false });
  if (!productDoc) {
    throw new NotFoundError('Product not found', 'cart.service.setItemQuantity');
  }
  assertStockAvailable(productDoc, quantity, 'cart.service.setItemQuantity');

  await CartModel.updateOne({ client: clientId, 'items.product': productId }, { $set: { 'items.$.quantity': quantity } });
  return getOrCreate(clientId);
}

export async function removeItem({ clientId, productId }: { clientId: string; productId: string }) {
  await cartRepository.getOrCreateForClient(clientId);
  await CartModel.updateOne({ client: clientId }, { $pull: { items: { product: productId } } });
  return getOrCreate(clientId);
}

export async function clearCart(clientId: string) {
  await cartRepository.getOrCreateForClient(clientId);
  await CartModel.updateOne({ client: clientId }, { $set: { items: [] } });
  return getOrCreate(clientId);
}
