import { ProductDocument, ProductModel } from '../models/product.model';
import BaseRepository from './base.repository';

class ProductRepository extends BaseRepository<ProductDocument> {
  constructor() {
    super(ProductModel);
  }
}

export const productRepository = new ProductRepository();
