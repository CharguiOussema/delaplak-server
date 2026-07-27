import { STATUS_CODE } from '../types/consts';
import BaseHttpError from './BaseHttpError';

export class NotAllowed extends BaseHttpError {
  constructor(message: any = 'NOT ALLOWED', functionName = '', error = {}, statusCode = STATUS_CODE.NOT_ALLOWED) {
    super(message, functionName, error, statusCode);
  }
}
