import { ProductAttributeDocument, ProductAttributeModel } from '../models/productAttribute.model';
import BaseRepository from './base.repository';

class ProductAttributeRepository extends BaseRepository<ProductAttributeDocument> {
  constructor() {
    super(ProductAttributeModel);
  }
}

export const productAttributeRepository = new ProductAttributeRepository();
