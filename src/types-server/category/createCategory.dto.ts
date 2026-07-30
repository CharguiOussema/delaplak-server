import { Expose, Type } from 'class-transformer';
import { IsMongoId, IsOptional, ValidateNested } from 'class-validator';
import { I18nTextDto } from './i18nText.dto';

export class CreateCategoryDto {
  @Expose()
  @ValidateNested()
  @Type(() => I18nTextDto)
  name!: I18nTextDto;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  description?: I18nTextDto;

  @Expose()
  @IsOptional()
  @IsMongoId()
  parent?: string;
}
