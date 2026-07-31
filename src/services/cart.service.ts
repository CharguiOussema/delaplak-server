import { cartRepository, productRepository } from '../repositories';
import { NotFoundError, BadRequestError } from '../errors';
import { CartModel, CartDocument } from '../models/cart.model';
import { computeUnitPrice, sameSelectedOptions, validateSelectedOptions, SelectedOptionInput } from '../helpers';

function withComputedPrices(cart: CartDocument) {
  const plain = cart.toObject();
  plain.items = plain.items.map((item: any) => ({
    ...item,
    unitPrice: item.product && typeof item.product === 'object' ? computeUnitPrice(item.product, itemSelectionInput(item)) : undefined,
  }));
  return plain;
}

function itemSelectionInput(item: { selectedOptions: { attribute: unknown; option: unknown }[] }): SelectedOptionInput[] {
  return item.selectedOptions.map((s) => ({ attribute: String(s.attribute), option: String(s.option) }));
}

async function getOrCreate(clientId: string) {
  await cartRepository.getOrCreateForClient(clientId);
  // Nested populate so the client can resolve each selected option's display name from
  // item.product.attributeOptions[].attribute (name + full options list) without another round trip.
  const cart = await CartModel.findOne({ client: clientId }).populate({
    path: 'items.product',
    populate: { path: 'attributeOptions.attribute' },
  });
  return withComputedPrices(cart!);
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

export async function addItem({
  clientId,
  product,
  quantity,
  selectedOptions,
}: {
  clientId: string;
  product: string;
  quantity: number;
  selectedOptions?: SelectedOptionInput[];
}) {
  const productDoc = await productRepository.getOne({ _id: product, isDeleted: false });
  if (!productDoc) {
    throw new NotFoundError('Product not found', 'cart.service.addItem');
  }

  const normalizedSelection = validateSelectedOptions(productDoc, selectedOptions, 'cart.service.addItem');

  const cart = await cartRepository.getOrCreateForClient(clientId);
  const existingItem = cart!.items.find(
    (item) => item.product.toString() === product && sameSelectedOptions(normalizedSelection, item.selectedOptions),
  );
  assertStockAvailable(productDoc, (existingItem?.quantity ?? 0) + quantity, 'cart.service.addItem');

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart!.items.push({ product: productDoc._id, quantity, selectedOptions: normalizedSelection } as any);
  }
  await cart!.save();

  return getOrCreate(clientId);
}

export async function setItemQuantity({ clientId, itemId, quantity }: { clientId: string; itemId: string; quantity: number }) {
  const cart = await CartModel.findOne({ client: clientId, 'items._id': itemId });
  if (!cart) {
    throw new NotFoundError('Item not found in cart', 'cart.service.setItemQuantity');
  }
  const item = cart.items.id(itemId)!;

  const productDoc = await productRepository.getOne({ _id: item.product, isDeleted: false });
  if (!productDoc) {
    throw new NotFoundError('Product not found', 'cart.service.setItemQuantity');
  }
  assertStockAvailable(productDoc, quantity, 'cart.service.setItemQuantity');

  item.quantity = quantity;
  await cart.save();
  return getOrCreate(clientId);
}

export async function removeItem({ clientId, itemId }: { clientId: string; itemId: string }) {
  await cartRepository.getOrCreateForClient(clientId);
  await CartModel.updateOne({ client: clientId }, { $pull: { items: { _id: itemId } } });
  return getOrCreate(clientId);
}

export async function clearCart(clientId: string) {
  await cartRepository.getOrCreateForClient(clientId);
  await CartModel.updateOne({ client: clientId }, { $set: { items: [] } });
  return getOrCreate(clientId);
}
