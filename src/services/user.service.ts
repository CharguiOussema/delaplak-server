import { userRepository, refreshTokenRepository } from '../repositories';
import { NotFoundError } from '../errors';
import { paginate, escapeRegex } from '../helpers';
import * as bcryptService from './bcrypt.service';
import { UserModel } from '../models/user.model';
import { USER_ROLES } from '../types/consts';
import { CreateUserDto, UpdateUserDto } from '../types-server/user';

export async function create({ payload }: { payload: CreateUserDto }) {
  const passwordHash = await bcryptService.hash(payload.password);
  return userRepository.create({
    email: payload.email.toLowerCase(),
    passwordHash,
    role: payload.role || USER_ROLES.CLIENT,
  } as any);
}

export async function getAll({ page, limit, search }: { page: number; limit: number; search?: string }) {
  const filter: Record<string, any> = { isDeleted: false };
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.email = regex;
  }
  return paginate(UserModel, filter, { page, limit });
}

export async function getById({ id }: { id: string }) {
  const user = await userRepository.getOne({ _id: id, isDeleted: false });
  if (!user) {
    throw new NotFoundError('User not found', 'user.service.getById');
  }
  return user;
}

export async function update({ id, payload }: { id: string; payload: UpdateUserDto }) {
  const user = await getById({ id });

  if (payload.email) user.email = payload.email.toLowerCase();
  if (payload.role) user.role = payload.role;
  if (payload.isActive !== undefined) user.isActive = payload.isActive;

  await user.save();
  return user;
}

export async function deactivate({ id }: { id: string }) {
  const user = await getById({ id });

  user.isActive = false;
  await user.save();
  await refreshTokenRepository.revokeAllForUser(user._id.toString());
  return user;
}
