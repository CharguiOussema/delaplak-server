import { Expose } from 'class-transformer';
import { IsInt, IsMongoId, Min } from 'class-validator';

export class AddCartItemDto {
  @Expose()
  @IsMongoId()
  product!: string;

  @Expose()
  @IsInt()
  @Min(1)
  quantity!: number;
}
