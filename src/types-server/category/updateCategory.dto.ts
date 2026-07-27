import { Expose, Type } from 'class-transformer';
import { IsMongoId, IsOptional, ValidateNested } from 'class-validator';
import { IsNullable } from '../../middlewares/validators/custom-decorators/IsNullable';
import { I18nTextDto } from './i18nText.dto';

export class UpdateCategoryDto {
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  name?: I18nTextDto;

  @Expose()
  @IsOptional()
  @IsNullable()
  @IsMongoId()
  parent?: string | null;
}
