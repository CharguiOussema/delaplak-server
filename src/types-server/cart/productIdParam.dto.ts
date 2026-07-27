import { Expose } from 'class-transformer';
import { IsMongoId } from 'class-validator';

export class ProductIdParamDto {
  @Expose()
  @IsMongoId()
  productId!: string;
}
