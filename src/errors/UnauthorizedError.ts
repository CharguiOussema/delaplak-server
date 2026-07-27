import { STATUS_CODE } from '../types/consts';
import BaseHttpError from './BaseHttpError';

export class UnauthorizedError extends BaseHttpError {
  constructor(msg: any = 'UNAUTHORIZED', functionName = '', error = {}, statusCode = STATUS_CODE.UNAUTHORIZED) {
    super(msg, functionName, error, statusCode);
  }
}
