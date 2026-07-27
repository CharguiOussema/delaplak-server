import { Expose } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { LANGUAGES } from '../../types/consts';

export class UpdateProfileDto {
  @Expose()
  @IsOptional()
  @IsEmail()
  email?: string;

  @Expose()
  @IsOptional()
  @IsEnum(LANGUAGES)
  preferredLanguage?: LANGUAGES;
}
