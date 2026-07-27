import { STATUS_CODE } from '../types/consts';
import BaseHttpError from './BaseHttpError';

export class NotFoundError extends BaseHttpError {
  constructor(message: any = 'NOT_FOUND', functionName = '', error = {}, statusCode = STATUS_CODE.NOT_FOUND) {
    super(message, functionName, error, statusCode);
  }
}
