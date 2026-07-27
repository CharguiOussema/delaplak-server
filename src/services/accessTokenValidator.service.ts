import { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../types/consts';
import { ForbiddenError } from '../errors';

export default class AccessTokenValidator {
  constructor(private readonly _args: Array<USER_ROLES>) {
    this.againstUserRole = this.againstUserRole.bind(this);
  }

  private async againstUserRole(req: Request, _: Response, next: NextFunction) {
    const { role } = req.currentUser;
    if (!this._args.includes(role)) {
      throw new ForbiddenError('ForbiddenError AccessTokenValidator');
    }
    next();
  }
  static hasRole(roles: Array<USER_ROLES>) {
    return new AccessTokenValidator(roles).againstUserRole;
  }
}
