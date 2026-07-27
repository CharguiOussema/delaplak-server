import { STATUS_CODE } from '../types/consts';
import BaseHttpError from './BaseHttpError';

export class ForbiddenError extends BaseHttpError {
  constructor(message: any = 'FORBIDDEN', functionName = '', error = {}, statusCode = STATUS_CODE.FORBIDDEN) {
    super(message, functionName, error, statusCode);
  }
}
