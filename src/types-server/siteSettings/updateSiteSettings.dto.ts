import { Expose, Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { HeroSectionDto } from './heroSection.dto';
import { StrengthsSectionDto } from './strengthsSection.dto';
import { DecorsSectionDto } from './decorsSection.dto';
import { CtaSectionDto } from './ctaSection.dto';

export class UpdateSiteSettingsDto {
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => HeroSectionDto)
  hero?: HeroSectionDto;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => StrengthsSectionDto)
  strengthsSection?: StrengthsSectionDto;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => DecorsSectionDto)
  decorsSection?: DecorsSectionDto;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => CtaSectionDto)
  cta?: CtaSectionDto;
}
