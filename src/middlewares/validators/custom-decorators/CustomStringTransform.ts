import { Transform } from 'class-transformer';
import { ValidationOptions } from 'class-validator';

interface ValidationOptions1 extends ValidationOptions {
  transform: (value: string) => any;
}

export function CustomStringTransform({ transform, ...validationOptions }: ValidationOptions1) {
  return Transform((ob: any) => {
    if (typeof ob?.value !== 'string') {
      return ob.value;
    }
    return transform(ob.value);
  }, validationOptions);
}
