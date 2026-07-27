import { Expose } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class SetCartItemQuantityDto {
  @Expose()
  @IsInt()
  @Min(1)
  quantity!: number;
}
