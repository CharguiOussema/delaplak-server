import { Expose } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { USER_ROLES } from '../../types/consts';

export class CreateUserDto {
  @Expose()
  @IsEmail()
  email!: string;

  @Expose()
  @IsString()
  @MinLength(8)
  password!: string;

  @Expose()
  @IsOptional()
  @IsEnum(USER_ROLES)
  role?: USER_ROLES;
}
