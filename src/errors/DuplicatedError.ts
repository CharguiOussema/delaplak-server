import { STATUS_CODE } from '../types/consts';
import BaseHttpError from './BaseHttpError';

export class DuplicatedError extends BaseHttpError {
  constructor(
    message: string | { reason: string; message?: string } = 'DUPLICATED',
    functionName = '',
    error = {},
    statusCode = STATUS_CODE.DUPLICATED,
  ) {
    super(message, functionName, error, statusCode);
  }
}
