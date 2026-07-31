import { Expose } from 'class-transformer';
import { IsMongoId } from 'class-validator';

export class OptionIdParamDto {
  @Expose()
  @IsMongoId()
  id!: string;

  @Expose()
  @IsMongoId()
  optionId!: string;
}
