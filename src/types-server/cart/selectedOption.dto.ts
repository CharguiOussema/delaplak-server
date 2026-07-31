import { Expose } from 'class-transformer';
import { IsMongoId } from 'class-validator';

export class SelectedOptionDto {
  @Expose()
  @IsMongoId()
  attribute!: string;

  @Expose()
  @IsMongoId()
  option!: string;
}
