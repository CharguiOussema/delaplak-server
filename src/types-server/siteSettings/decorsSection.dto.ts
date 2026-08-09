import { Expose, Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { I18nTextDto } from '../category/i18nText.dto';

export class DecorsSectionDto {
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  eyebrow?: I18nTextDto;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  title?: I18nTextDto;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  discoverLabel?: I18nTextDto;
}
