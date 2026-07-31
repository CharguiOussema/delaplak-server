import { Expose, Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { I18nTextDto } from '../category/i18nText.dto';

export class CreateProductAttributeDto {
  @Expose()
  @ValidateNested()
  @Type(() => I18nTextDto)
  name!: I18nTextDto;

  @Expose()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => I18nTextDto)
  options?: I18nTextDto[];
}
