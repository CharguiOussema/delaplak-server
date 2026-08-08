import { Expose } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { USER_ROLES } from '../../types/consts';
import { PHONE_REGEX } from '../common';

export class UpdateUserDto {
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
  @IsEnum(USER_ROLES)
  role?: USER_ROLES;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
