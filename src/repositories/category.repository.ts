import { CategoryDocument, CategoryModel } from '../models/category.model';
import BaseRepository from './base.repository';

class CategoryRepository extends BaseRepository<CategoryDocument> {
  constructor() {
    super(CategoryModel);
  }
}

export const categoryRepository = new CategoryRepository();
