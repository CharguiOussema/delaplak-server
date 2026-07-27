import { Expose } from 'class-transformer';
import { IsMongoId } from 'class-validator';

export class IdParamDto {
  @Expose()
  @IsMongoId()
  id!: string;
}
