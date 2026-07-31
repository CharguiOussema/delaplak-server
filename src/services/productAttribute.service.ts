import { productAttributeRepository } from '../repositories';
import { NotFoundError, BadRequestError } from '../errors';
import { paginate, escapeRegex, slugify, resolveI18nText } from '../helpers';
import { UserDocument } from '../models/user.model';
import { ProductAttributeModel } from '../models/productAttribute.model';
import { ProductModel } from '../models/product.model';
import { CreateProductAttributeDto, UpdateProductAttributeDto, AttributeOptionDto } from '../types-server/productAttribute';

async function generateUniqueSlug(nameEn: string, excludeId?: string): Promise<string> {
  const base = slugify(nameEn);
  let slug = base;
  let i = 1;
  while (
    await ProductAttributeModel.exists({ slug, isDeleted: false, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })
  ) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

export async function create({ payload, currentUser }: { payload: CreateProductAttributeDto; currentUser: UserDocument }) {
  const name = resolveI18nText(payload.name, 'name');
  const slug = await generateUniqueSlug(name.en);
  const options = (payload.options ?? []).map((option) => ({ name: resolveI18nText(option, 'option.name') }));
  return productAttributeRepository.create({
    name,
    slug,
    options,
    createdBy: currentUser._id,
    updatedBy: currentUser._id,
  } as any);
}

export async function getAll({ page, limit, search }: { page: number; limit: number; search?: string }) {
  const filter: Record<string, any> = { isDeleted: false };
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ 'name.en': regex }, { 'name.fr': regex }, { 'name.ar': regex }, { slug: regex }];
  }
  return paginate(ProductAttributeModel, filter, { page, limit });
}

export async function getById(id: string) {
  const attribute = await productAttributeRepository.getOne({ _id: id, isDeleted: false });
  if (!attribute) {
    throw new NotFoundError('Product attribute not found', 'productAttribute.service.getById');
  }
  return attribute;
}

export async function update({ id, payload, currentUser }: { id: string; payload: UpdateProductAttributeDto; currentUser: UserDocument }) {
  const attribute = await getById(id);

  if (payload.name) {
    attribute.name = resolveI18nText(payload.name, 'name');
    attribute.slug = await generateUniqueSlug(attribute.name.en, String(attribute._id));
  }

  attribute.updatedBy = currentUser._id;
  await attribute.save();
  return attribute;
}

async function assertNotReferencedByProducts(attributeId: string, functionName: string, optionId?: string) {
  const filter: Record<string, any> = { isDeleted: false, 'attributeOptions.attribute': attributeId };
  if (optionId) filter['attributeOptions.option'] = optionId;
  const count = await ProductModel.countDocuments(filter);
  if (count > 0) {
    throw new BadRequestError(`Cannot delete: ${count} product(s) still reference it`, functionName);
  }
}

export async function remove(id: string) {
  const attribute = await getById(id);
  await assertNotReferencedByProducts(String(attribute._id), 'productAttribute.service.remove');
  attribute.isDeleted = true;
  await attribute.save();
  return attribute;
}

export async function filter() {
  const attributes = await ProductAttributeModel.find({ isDeleted: false }).select('name').lean();
  return attributes.map((a) => ({ label: a.name.en, value: a._id.toString() }));
}

export async function addOption({ id, payload, currentUser }: { id: string; payload: AttributeOptionDto; currentUser: UserDocument }) {
  const attribute = await getById(id);
  attribute.options.push({ name: resolveI18nText(payload.name, 'option.name') } as any);
  attribute.updatedBy = currentUser._id;
  await attribute.save();
  return attribute;
}

export async function updateOption({
  id,
  optionId,
  payload,
  currentUser,
}: {
  id: string;
  optionId: string;
  payload: AttributeOptionDto;
  currentUser: UserDocument;
}) {
  const attribute = await getById(id);
  const option = attribute.options.id(optionId);
  if (!option) {
    throw new NotFoundError('Option not found', 'productAttribute.service.updateOption');
  }
  option.name = resolveI18nText(payload.name, 'option.name');
  attribute.updatedBy = currentUser._id;
  await attribute.save();
  return attribute;
}

export async function removeOption({ id, optionId, currentUser }: { id: string; optionId: string; currentUser: UserDocument }) {
  const attribute = await getById(id);
  const option = attribute.options.id(optionId);
  if (!option) {
    throw new NotFoundError('Option not found', 'productAttribute.service.removeOption');
  }
  await assertNotReferencedByProducts(String(attribute._id), 'productAttribute.service.removeOption', optionId);
  option.deleteOne();
  attribute.updatedBy = currentUser._id;
  await attribute.save();
  return attribute;
}
