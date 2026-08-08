import { Expose } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { LANGUAGES } from '../../types/consts';
import { PHONE_REGEX } from '../common';

export class UpdateProfileDto {
  @Expose()
  @IsOptional()
  @IsEmail()
  email?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @Matches(PHONE_REGEX, { message: 'phone must be a valid phone number' })
  phone?: string;

  @Expose()
  @IsOptional()
  @IsEnum(LANGUAGES)
  preferredLanguage?: LANGUAGES;
}
