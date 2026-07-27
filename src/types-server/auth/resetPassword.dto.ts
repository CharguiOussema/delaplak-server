import { Expose } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @Expose()
  @IsString()
  token!: string;

  @Expose()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
