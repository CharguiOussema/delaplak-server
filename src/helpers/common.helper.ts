import { Model, FilterQuery } from 'mongoose';

export type PaginationResult<T> = {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  nextPage: number | null;
  hasPrevPage: boolean;
  prevPage: number | null;
};

export async function paginate<T>(
  model: Model<T>,
  filter: FilterQuery<T>,
  { page = 1, limit = 10, sort = { createdAt: -1 }, populate }: { page?: number; limit?: number; sort?: any; populate?: any },
): Promise<PaginationResult<T>> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const skip = (safePage - 1) * safeLimit;

  let query = model.find(filter).sort(sort).skip(skip).limit(safeLimit);
  if (populate) {
    query = query.populate(populate);
  }

  const [docs, totalDocs] = await Promise.all([query.exec(), model.countDocuments(filter)]);

  const totalPages = Math.ceil(totalDocs / safeLimit) || 1;

  return {
    docs: docs as unknown as T[],
    totalDocs,
    limit: safeLimit,
    page: safePage,
    totalPages,
    hasNextPage: safePage < totalPages,
    nextPage: safePage < totalPages ? safePage + 1 : null,
    hasPrevPage: safePage > 1,
    prevPage: safePage > 1 ? safePage - 1 : null,
  };
}

export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function slugify(text: string): string {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
