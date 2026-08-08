import { Expose } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { USER_ROLES } from '../../types/consts';
import { PHONE_REGEX } from '../common';

export class CreateUserDto {
  @Expose()
  @IsEmail()
  email!: string;

  @Expose()
  @IsString()
  @MinLength(8)
  password!: string;

  @Expose()
  @IsString()
  @MinLength(2)
  fullName!: string;

  @Expose()
  @IsString()
  @Matches(PHONE_REGEX, { message: 'phone must be a valid phone number' })
  phone!: string;

  @Expose()
  @IsOptional()
  @IsEnum(USER_ROLES)
  role?: USER_ROLES;
}
