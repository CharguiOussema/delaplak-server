import { RefreshTokenDocument, RefreshTokenModel } from '../models/refreshToken.model';
import BaseRepository from './base.repository';

class RefreshTokenRepository extends BaseRepository<RefreshTokenDocument> {
  constructor() {
    super(RefreshTokenModel);
  }

  revokeFamily(family: string) {
    return this.model.updateMany({ family, revokedAt: null }, { revokedAt: new Date() });
  }

  revokeAllForUser(user: string) {
    return this.model.updateMany({ user, revokedAt: null }, { revokedAt: new Date() });
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
