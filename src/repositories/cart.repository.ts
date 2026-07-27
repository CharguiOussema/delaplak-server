import { CartDocument, CartModel } from '../models/cart.model';
import BaseRepository from './base.repository';

class CartRepository extends BaseRepository<CartDocument> {
  constructor() {
    super(CartModel);
  }

  getOrCreateForClient(client: string) {
    return this.model.findOneAndUpdate({ client }, { $setOnInsert: { client, items: [] } }, { new: true, upsert: true });
  }
}

export const cartRepository = new CartRepository();
