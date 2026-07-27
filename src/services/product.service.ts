import { productRepository, categoryRepository } from '../repositories';
import { NotFoundError, BadRequestError } from '../errors';
import { paginate, escapeRegex } from '../helpers';
import { UserDocument } from '../models/user.model';
import { ProductModel } from '../models/product.model';
import { CreateProductDto, UpdateProductDto } from '../types-server/product';
import { deleteProductImageFile } from './upload.service';

async function assertCategoryExists(categoryId: string) {
  const category = await categoryRepository.getOne({ _id: categoryId, isDeleted: false });
  if (!category) {
    throw new NotFoundError('Category not found', 'product.service.assertCategoryExists');
  }
}

export async function create({ payload, currentUser }: { payload: CreateProductDto; currentUser: UserDocument }) {
  await assertCategoryExists(payload.category);
  return productRepository.create({
    ...payload,
    images: [],
    stock: payload.stock ?? 0,
    createdBy: currentUser._id,
    updatedBy: currentUser._id,
  } as any);
}

export async function getAll({
  page,
  limit,
  search,
  category,
}: {
  page: number;
  limit: number;
  search?: string;
  category?: string;
}) {
  const filter: Record<string, any> = { isDeleted: false };
  if (category) filter.category = category;
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ 'name.en': regex }, { 'name.fr': regex }, { 'name.ar': regex }, { texture: regex }];
  }
  return paginate(ProductModel, filter, { page, limit, populate: 'category' });
}

export async function getById(id: string) {
  const product = await productRepository.getOne({ _id: id, isDeleted: false }).populate('category');
  if (!product) {
    throw new NotFoundError('Product not found', 'product.service.getById');
  }
  return product;
}

export async function update({ id, payload, currentUser }: { id: string; payload: UpdateProductDto; currentUser: UserDocument }) {
  const product = await productRepository.getOne({ _id: id, isDeleted: false });
  if (!product) {
    throw new NotFoundError('Product not found', 'product.service.update');
  }

  if (payload.category) {
    await assertCategoryExists(payload.category);
  }

  Object.assign(product, payload, { updatedBy: currentUser._id });
  await product.save();
  return product;
}

export async function remove(id: string) {
  const product = await productRepository.getOne({ _id: id, isDeleted: false });
  if (!product) {
    throw new NotFoundError('Product not found', 'product.service.remove');
  }
  product.isDeleted = true;
  await product.save();
  return product;
}

export async function filter() {
  const products = await ProductModel.find({ isDeleted: false }).select('name').lean();
  return products.map((p) => ({ label: p.name.en, value: p._id.toString() }));
}

export async function addImages({ id, fileNames, currentUser }: { id: string; fileNames: string[]; currentUser: UserDocument }) {
  const product = await productRepository.getOne({ _id: id, isDeleted: false });
  if (!product) {
    throw new NotFoundError('Product not found', 'product.service.addImages');
  }

  const relativePaths = fileNames.map((f) => `/uploads/products/${f}`);
  product.images.push(...relativePaths);
  product.updatedBy = currentUser._id;
  await product.save();
  return product;
}

export async function removeImage({ id, path, currentUser }: { id: string; path: string; currentUser: UserDocument }) {
  const product = await productRepository.getOne({ _id: id, isDeleted: false });
  if (!product) {
    throw new NotFoundError('Product not found', 'product.service.removeImage');
  }

  if (!product.images.includes(path)) {
    throw new BadRequestError('Image not found on this product', 'product.service.removeImage');
  }

  product.images = product.images.filter((img) => img !== path);
  product.updatedBy = currentUser._id;
  await product.save();

  deleteProductImageFile(path);
  return product;
}
