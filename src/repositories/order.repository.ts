import { OrderDocument, OrderModel } from '../models/order.model';
import BaseRepository from './base.repository';

class OrderRepository extends BaseRepository<OrderDocument> {
  constructor() {
    super(OrderModel);
  }
}

export const orderRepository = new OrderRepository();
