import { Expose } from 'class-transformer';
import { IsMongoId } from 'class-validator';

export class CartItemIdParamDto {
  @Expose()
  @IsMongoId()
  itemId!: string;
}
