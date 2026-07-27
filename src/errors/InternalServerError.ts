import { STATUS_CODE } from '../types/consts';
import BaseHttpError from './BaseHttpError';

export class InternalServerError extends BaseHttpError {
  constructor(message: any = 'INTERNAL_SERVER_ERROR', functionName = '', error = {}, statusCode = STATUS_CODE.INTERNAL_SERVER) {
    super(message, functionName, error, statusCode);
  }
}
