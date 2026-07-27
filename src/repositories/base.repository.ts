import { Model, FilterQuery, UpdateQuery, Document, Types } from 'mongoose';
import { DuplicatedError, InternalServerError } from '../errors';

/**
 * Thin wrapper shared by every repository: mongoose calls are wrapped so unexpected
 * (non-domain) failures surface as InternalServerError, and unique-index violations
 * surface as DuplicatedError, per the request-lifecycle pattern in ARCHITECTURE.md §2.10.
 * Read methods (`getOne`/`getAll`/`getById`) intentionally return the Mongoose Query
 * object (not a resolved Promise) so callers can chain `.lean()`/`.populate()`/`.select()`
 * the same way `bcrypt.service.ts` does with `userRepository.getOne(...).lean()`.
 */
export default class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  getOne(filter: FilterQuery<T> = {}) {
    return this.model.findOne(filter);
  }

  getById(id: string | Types.ObjectId) {
    return this.model.findById(id);
  }

  getAll(filter: FilterQuery<T> = {}) {
    return this.model.find(filter);
  }

  countDocuments(filter: FilterQuery<T> = {}) {
    return this.model.countDocuments(filter);
  }

  async create(data: Partial<T>): Promise<T> {
    try {
      const doc = await this.model.create(data);
      return doc;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new DuplicatedError('DUPLICATED', `${this.model.modelName}.repository.create`, { error });
      }
      throw new InternalServerError(error?.message, `${this.model.modelName}.repository.create`, { error });
    }
  }

  updateById(id: string | Types.ObjectId, update: UpdateQuery<T>) {
    return this.model.findByIdAndUpdate(id, update, { new: true });
  }

  updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>) {
    return this.model.findOneAndUpdate(filter, update, { new: true });
  }

  async softDeleteById(id: string | Types.ObjectId): Promise<T | null> {
    try {
      return await this.model.findByIdAndUpdate(id, { isDeleted: true } as UpdateQuery<T>, { new: true });
    } catch (error: any) {
      throw new InternalServerError(error?.message, `${this.model.modelName}.repository.softDeleteById`, { error });
    }
  }
}
