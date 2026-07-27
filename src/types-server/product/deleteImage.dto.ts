import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class DeleteProductImageDto {
  @Expose()
  @IsString()
  path!: string;
}
