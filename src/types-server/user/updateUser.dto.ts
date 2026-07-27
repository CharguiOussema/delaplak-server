import { Expose } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { USER_ROLES } from '../../types/consts';

export class UpdateUserDto {
  @Expose()
  @IsOptional()
  @IsEmail()
  email?: string;

  @Expose()
  @IsOptional()
  @IsEnum(USER_ROLES)
  role?: USER_ROLES;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
