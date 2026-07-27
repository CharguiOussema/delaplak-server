import { orderRepository, userRepository } from '../repositories';
import { NotFoundError, ForbiddenError, BadRequestError } from '../errors';
import { paginate } from '../helpers';
import { OrderModel, OrderItem } from '../models/order.model';
import { CartModel } from '../models/cart.model';
import { UserDocument } from '../models/user.model';
import { USER_ROLES, ORDER_STATUS } from '../types/consts';
import { mailerService } from './mailer.service';
import * as invoiceService from './invoice.service';
import { isInTestMode } from '../config';

function isStaff(user: UserDocument) {
  return user.role === USER_ROLES.ADMIN;
}

export async function create({ currentUser }: { currentUser: UserDocument }) {
  const cart = await CartModel.findOne({ client: currentUser._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    throw new BadRequestError('Cart is empty', 'order.service.create');
  }

  const items: OrderItem[] = cart.items.map((item: any) => ({
    product: item.product._id,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
  }));

  const totalAmount = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  const order = await orderRepository.create({
    client: currentUser._id,
    items,
    totalAmount,
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

export async function confirm({ id, currentUser }: { id: string; currentUser: UserDocument }) {
  const order = await orderRepository.getOne({ _id: id, isDeleted: false });
  if (!order) {
    throw new NotFoundError('Order not found', 'order.service.confirm');
  }

  if (order.status !== ORDER_STATUS.PENDING) {
    throw new BadRequestError(`Order is already ${order.status}`, 'order.service.confirm');
  }

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
