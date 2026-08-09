import { Expose, Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { I18nTextDto } from '../category/i18nText.dto';

export class HeroSectionDto {
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  eyebrow?: I18nTextDto;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  titleLine1?: I18nTextDto;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  titleAccent?: I18nTextDto;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  intro?: I18nTextDto;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  ctaPrimaryLabel?: I18nTextDto;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  ctaSecondaryLabel?: I18nTextDto;
}
