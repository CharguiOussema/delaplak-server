import { productRepository, categoryRepository, productAttributeRepository } from '../repositories';
import { NotFoundError, BadRequestError } from '../errors';
import { paginate, escapeRegex, resolveI18nText } from '../helpers';
import { UserDocument } from '../models/user.model';
import { ProductModel } from '../models/product.model';
import { CreateProductDto, UpdateProductDto, ProductAttributeSelectionDto } from '../types-server/product';
import { deleteProductImageFile } from './upload.service';

async function assertCategoriesExist(categoryIds: string[]) {
  const count = await categoryRepository.countDocuments({ _id: { $in: categoryIds }, isDeleted: false });
  if (count !== categoryIds.length) {
    throw new NotFoundError('One or more categories not found', 'product.service.assertCategoriesExist');
  }
}

// Every (attribute, option) pair a product declares must reference a real, still-active
// attribute type and one of its options — the price adjustment itself is trusted as
// product-specific input, but the vocabulary it points at is not.
async function assertAttributeOptionsValid(selections: ProductAttributeSelectionDto[]) {
  const attributeIds = [...new Set(selections.map((s) => s.attribute))];
  const attributes = await productAttributeRepository.getAll({ _id: { $in: attributeIds }, isDeleted: false });
  const attributeById = new Map(attributes.map((a) => [a._id.toString(), a]));

  const seenPairs = new Set<string>();
  for (const selection of selections) {
    const attribute = attributeById.get(selection.attribute);
    if (!attribute) {
      throw new NotFoundError('One or more product attributes not found', 'product.service.assertAttributeOptionsValid');
    }
    if (!attribute.options.id(selection.option)) {
      throw new NotFoundError('One or more attribute options not found', 'product.service.assertAttributeOptionsValid');
    }
    const pairKey = `${selection.attribute}:${selection.option}`;
    if (seenPairs.has(pairKey)) {
      throw new BadRequestError('Duplicate attribute option in product settings', 'product.service.assertAttributeOptionsValid');
    }
    seenPairs.add(pairKey);
  }
}

export async function create({ payload, currentUser }: { payload: CreateProductDto; currentUser: UserDocument }) {
  await assertCategoriesExist(payload.categories);
  if (payload.attributeOptions?.length) {
    await assertAttributeOptionsValid(payload.attributeOptions);
  }
  const name = resolveI18nText(payload.name, 'name');
  const description = resolveI18nText(payload.description, 'description');
  return productRepository.create({
    ...payload,
    name,
    description,
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
  if (category) filter.categories = category;
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ 'name.en': regex }, { 'name.fr': regex }, { 'name.ar': regex }];
  }
  return paginate(ProductModel, filter, { page, limit, populate: ['categories', 'attributeOptions.attribute'] });
}

export async function getById(id: string) {
  const product = await productRepository
    .getOne({ _id: id, isDeleted: false })
    .populate('categories')
    .populate('attributeOptions.attribute');
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

  if (payload.categories) {
    await assertCategoriesExist(payload.categories);
  }
  if (payload.attributeOptions) {
    await assertAttributeOptionsValid(payload.attributeOptions);
  }

  const resolvedPayload: Record<string, any> = { ...payload };
  if (payload.name) resolvedPayload.name = resolveI18nText(payload.name, 'name');
  if (payload.description) resolvedPayload.description = resolveI18nText(payload.description, 'description');

  Object.assign(product, resolvedPayload, { updatedBy: currentUser._id });
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
