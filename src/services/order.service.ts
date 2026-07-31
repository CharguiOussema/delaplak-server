import { orderRepository, userRepository, productRepository, productAttributeRepository } from '../repositories';
import { NotFoundError, ForbiddenError, BadRequestError } from '../errors';
import { paginate, computeUnitPrice } from '../helpers';
import { OrderModel, OrderItem, OrderItemSelectedOption } from '../models/order.model';
import { CartModel } from '../models/cart.model';
import { UserDocument } from '../models/user.model';
import { USER_ROLES, ORDER_STATUS } from '../types/consts';
import { mailerService } from './mailer.service';
import * as invoiceService from './invoice.service';
import { isInTestMode } from '../config';

function isStaff(user: UserDocument) {
  return user.role === USER_ROLES.ADMIN;
}

// Attribute/option names are frozen onto the order at checkout time (see OrderItemSelectedOption),
// so a later rename/deletion in Settings never rewrites history for orders already placed.
async function resolveSelectedOptionSnapshots(cartItems: any[]): Promise<OrderItemSelectedOption[][]> {
  const attributeIds = [...new Set(cartItems.flatMap((item) => item.selectedOptions.map((s: any) => s.attribute.toString())))];
  const attributes = await productAttributeRepository.getAll({ _id: { $in: attributeIds }, isDeleted: false });
  const attributeById = new Map(attributes.map((a) => [a._id.toString(), a]));

  return cartItems.map((item) =>
    item.selectedOptions.map((selection: any): OrderItemSelectedOption => {
      const attribute = attributeById.get(selection.attribute.toString());
      const option = attribute?.options.id(selection.option);
      const configured = item.product.attributeOptions.find(
        (entry: any) => entry.attribute.toString() === selection.attribute.toString() && entry.option.toString() === selection.option.toString(),
      );
      return {
        attributeName: attribute?.name ?? { en: 'Unknown', fr: 'Inconnu', ar: 'غير معروف' },
        optionName: option?.name ?? { en: 'Unknown', fr: 'Inconnu', ar: 'غير معروف' },
        priceAdjustment: configured?.priceAdjustment ?? 0,
      };
    }),
  );
}

export async function create({ currentUser }: { currentUser: UserDocument }) {
  const cart = await CartModel.findOne({ client: currentUser._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    throw new BadRequestError('Cart is empty', 'order.service.create');
  }

  for (const item of cart.items as any[]) {
    if (item.quantity > item.product.stock) {
      throw new BadRequestError(
        `Insufficient stock for "${item.product.name.en}": requested ${item.quantity}, available ${item.product.stock}`,
        'order.service.create',
      );
    }
  }

  const selectedOptionSnapshots = await resolveSelectedOptionSnapshots(cart.items as any[]);

  const items: OrderItem[] = cart.items.map((item: any, index: number) => ({
    product: item.product._id,
    name: item.product.name,
    price: computeUnitPrice(
      item.product,
      item.selectedOptions.map((s: any) => ({ attribute: s.attribute.toString(), option: s.option.toString() })),
    ),
    currency: item.product.currency,
    quantity: item.quantity,
    selectedOptions: selectedOptionSnapshots[index],
  }));

  const totalAmount = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  const order = await orderRepository.create({
    client: currentUser._id,
    items,
    totalAmount,
    // All items in a cart share one currency (single-vendor catalog assumption already
    // baked into the cart/checkout UI, which totals using the first item's currency).
    currency: items[0].currency,
    status: ORDER_STATUS.PENDING,
  } as any);

  cart.items = [] as any;
  await cart.save();

  mailerService
    .sendOrderCreatedEmail(currentUser.email, currentUser.preferredLanguage, {
      orderId: order._id.toString(),
      totalAmount,
      items,
    })
    .catch((err: unknown) => {
      if (!isInTestMode) console.error('[order.service] failed to send order created email', err);
    });

  return order;
}

export async function getAll({
  page,
  limit,
  currentUser,
  status,
}: {
  page: number;
  limit: number;
  currentUser: UserDocument;
  status?: ORDER_STATUS;
}) {
  const filter: Record<string, any> = { isDeleted: false };
  if (!isStaff(currentUser)) filter.client = currentUser._id;
  if (status) filter.status = status;
  return paginate(OrderModel, filter, { page, limit, populate: 'client confirmedBy' });
}

export async function getById({ id, currentUser }: { id: string; currentUser: UserDocument }) {
  const order = await orderRepository.getOne({ _id: id, isDeleted: false });
  if (!order) {
    throw new NotFoundError('Order not found', 'order.service.getById');
  }

  if (!isStaff(currentUser) && order.client.toString() !== currentUser._id.toString()) {
    throw new ForbiddenError('You may only view your own orders', 'order.service.getById');
  }

  await order.populate('client confirmedBy');
  return order;
}

// Confirm and cancel are the only two ways an order's status ever changes after creation,
// and both are one-way: once a PENDING order is decided, neither route accepts it again.
async function getPendingOrderOrThrow(id: string, functionName: string) {
  const order = await orderRepository.getOne({ _id: id, isDeleted: false });
  if (!order) {
    throw new NotFoundError('Order not found', functionName);
  }

  if (order.status !== ORDER_STATUS.PENDING) {
    throw new BadRequestError(`Order is already ${order.status}`, functionName);
  }

  return order;
}

// Decrements stock item by item, guarding each write against the stock still being
// available at that instant (protects against a concurrent order draining it first). If any
// item runs out, every already-decremented item in this order is put back before failing, so
// a partially-stocked order never partially reserves inventory.
async function decrementStockForItems(items: OrderItem[], functionName: string) {
  const decremented: OrderItem[] = [];

  for (const item of items) {
    const updated = await productRepository.decrementStock(item.product, item.quantity);
    if (!updated) {
      await Promise.all(decremented.map((it) => productRepository.incrementStock(it.product, it.quantity)));
      throw new BadRequestError(`Insufficient stock for "${item.name.en}"`, functionName);
    }
    decremented.push(item);
  }
}

export async function confirm({ id, currentUser }: { id: string; currentUser: UserDocument }) {
  const order = await getPendingOrderOrThrow(id, 'order.service.confirm');

  await decrementStockForItems(order.items, 'order.service.confirm');

  order.status = ORDER_STATUS.CONFIRMED;
  order.confirmedBy = currentUser._id;
  order.confirmedAt = new Date();
  await order.save();

  const client = await userRepository.getOne({ _id: order.client, isDeleted: false });
  const invoice = await invoiceService.generateForOrder(order, client!.email);

  mailerService
    .sendOrderConfirmedEmail(client!.email, client!.preferredLanguage, {
      orderId: order._id.toString(),
      invoiceNumber: invoice.number,
      totalAmount: order.totalAmount,
    })
    .catch((err: unknown) => {
      if (!isInTestMode) console.error('[order.service] failed to send order confirmed email', err);
    });

  return { order, invoice };
}

export async function cancel({ id, currentUser }: { id: string; currentUser: UserDocument }) {
  const order = await getPendingOrderOrThrow(id, 'order.service.cancel');

  if (!isStaff(currentUser) && order.client.toString() !== currentUser._id.toString()) {
    throw new ForbiddenError('You may only cancel your own orders', 'order.service.cancel');
  }

  order.status = ORDER_STATUS.CANCELLED;
  order.cancelledBy = currentUser._id;
  order.cancelledAt = new Date();
  await order.save();

  const client = await userRepository.getOne({ _id: order.client, isDeleted: false });

  mailerService
    .sendOrderCancelledEmail(client!.email, client!.preferredLanguage, {
      orderId: order._id.toString(),
      totalAmount: order.totalAmount,
    })
    .catch((err: unknown) => {
      if (!isInTestMode) console.error('[order.service] failed to send order cancelled email', err);
    });

  return order;
}
