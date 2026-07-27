import { STATUS_CODE } from '../types/consts';

class BaseHttpError extends Error {
  constructor(
    public readonly message: string | any,
    public readonly functionName: string,
    public readonly error: object | unknown,
    public readonly statusCode: number | STATUS_CODE,
  ) {
    super(message);
  }
}
export default BaseHttpError;
