import { categoryRepository } from '../repositories';
import { NotFoundError, DuplicatedError } from '../errors';
import { paginate, escapeRegex, slugify } from '../helpers';
import { UserDocument } from '../models/user.model';
import { CategoryModel, CategoryDocument } from '../models/category.model';
import { CreateCategoryDto, UpdateCategoryDto } from '../types-server/category';

async function generateUniqueSlug(nameEn: string, excludeId?: string): Promise<string> {
  const base = slugify(nameEn);
  let slug = base;
  let i = 1;
  // small collection — a linear uniqueness probe is fine at this scale
  while (await CategoryModel.exists({ slug, isDeleted: false, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

export async function create({ payload, currentUser }: { payload: CreateCategoryDto; currentUser: UserDocument }) {
  if (payload.parent) {
    const parent = await categoryRepository.getOne({ _id: payload.parent, isDeleted: false });
    if (!parent) {
      throw new NotFoundError('Parent category not found', 'category.service.create');
    }
  }

  const slug = await generateUniqueSlug(payload.name.en);
  return categoryRepository.create({
    name: payload.name,
    slug,
    parent: payload.parent || null,
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
  return paginate(CategoryModel, filter, { page, limit });
}

export async function getById(id: string) {
  const category = await categoryRepository.getOne({ _id: id, isDeleted: false });
  if (!category) {
    throw new NotFoundError('Category not found', 'category.service.getById');
  }
  return category;
}

export async function update({ id, payload, currentUser }: { id: string; payload: UpdateCategoryDto; currentUser: UserDocument }) {
  const category = await getById(id);

  if (payload.parent !== undefined) {
    if (payload.parent === String(category._id)) {
      throw new DuplicatedError('A category cannot be its own parent', 'category.service.update');
    }
    category.parent = (payload.parent as any) || null;
  }

  if (payload.name) {
    category.name = payload.name;
    category.slug = await generateUniqueSlug(payload.name.en, String(category._id));
  }

  category.updatedBy = currentUser._id;
  await category.save();
  return category;
}

export async function remove(id: string) {
  const category = await getById(id);
  category.isDeleted = true;
  await category.save();
  return category;
}

export async function filter() {
  const categories = await CategoryModel.find({ isDeleted: false }).select('name').lean();
  return categories.map((c) => ({ label: c.name.en, value: c._id.toString() }));
}

export interface CategoryTreeNode {
  _id: string;
  name: CategoryDocument['name'];
  slug: string;
  children: CategoryTreeNode[];
}

export async function tree(): Promise<CategoryTreeNode[]> {
  const categories = await CategoryModel.find({ isDeleted: false }).lean();

  const byId = new Map<string, CategoryTreeNode>();
  categories.forEach((c) => {
    byId.set(c._id.toString(), { _id: c._id.toString(), name: c.name, slug: c.slug, children: [] });
  });

  const roots: CategoryTreeNode[] = [];
  categories.forEach((c) => {
    const node = byId.get(c._id.toString())!;
    if (c.parent && byId.has(c.parent.toString())) {
      byId.get(c.parent.toString())!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}
