import { Expose, Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { I18nTextDto } from '../category/i18nText.dto';

export class UpdateProductAttributeDto {
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  name?: I18nTextDto;
}
