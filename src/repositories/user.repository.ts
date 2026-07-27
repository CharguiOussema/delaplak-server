import { UserDocument, UserModel } from '../models/user.model';
import BaseRepository from './base.repository';

class UserRepository extends BaseRepository<UserDocument> {
  constructor() {
    super(UserModel);
  }
}

export const userRepository = new UserRepository();
