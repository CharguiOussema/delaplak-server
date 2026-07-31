import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { I18nTextDto } from '../category/i18nText.dto';

export class AttributeOptionDto {
  @Expose()
  @ValidateNested()
  @Type(() => I18nTextDto)
  name!: I18nTextDto;
}
