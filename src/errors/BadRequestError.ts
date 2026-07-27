import { STATUS_CODE } from '../types/consts';
import BaseHttpError from './BaseHttpError';

export class BadRequestError extends BaseHttpError {
  constructor(message: any = 'BAD_REQUEST', functionName = '', error = {}, statusCode = STATUS_CODE.BAD_REQUEST) {
    super(message, functionName, error, statusCode);
  }
}
