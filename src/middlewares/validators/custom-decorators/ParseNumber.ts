import { Transform } from 'class-transformer';
import { ValidationOptions } from 'class-validator';

export function ParseToNumber(validationOptions: Partial<ValidationOptions> & { defaultValue: number; maxNumber?: number }) {
  const { defaultValue, maxNumber, ...otherOptions } = validationOptions;
  return Transform((obj: any) => {
    const newNumberValue = parseInt(obj.value) || defaultValue;
    if (maxNumber) {
      return Math.min(newNumberValue, maxNumber);
    }
    return newNumberValue;
  }, otherOptions);
}
