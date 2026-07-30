import { Types } from 'mongoose';
import { ProductDocument, ProductModel } from '../models/product.model';
import BaseRepository from './base.repository';

class ProductRepository extends BaseRepository<ProductDocument> {
  constructor() {
    super(ProductModel);
  }

  /**
   * Atomically decrements stock, only when enough is still available. The `stock: { $gte:
   * quantity }` guard in the filter makes this safe under concurrent confirmations: two
   * confirms racing for the last units can't both succeed and drive stock negative.
   * Returns null when there isn't enough stock left.
   */
  decrementStock(id: string | Types.ObjectId, quantity: number) {
    return this.model.findOneAndUpdate({ _id: id, stock: { $gte: quantity } }, { $inc: { stock: -quantity } }, { new: true });
  }

  incrementStock(id: string | Types.ObjectId, quantity: number) {
    return this.model.findByIdAndUpdate(id, { $inc: { stock: quantity } }, { new: true });
  }
}

export const productRepository = new ProductRepository();
