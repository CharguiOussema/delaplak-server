import { STATUS_CODE } from '../types/consts';
import BaseHttpError from './BaseHttpError';

export class LockedError extends BaseHttpError {
  constructor(msg: any = 'LOCKED', functionName = '', error = {}, statusCode = STATUS_CODE.LOCKED) {
    super(msg, functionName, error, statusCode);
  }
}
export default LockedError;
