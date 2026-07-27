import { ValidationOptions, ValidateIf } from 'class-validator';

export function IsNullable(validationOptions?: ValidationOptions) {
  return ValidateIf((ob: any, v: any) => {
    return v !== null;
  }, validationOptions);
}
