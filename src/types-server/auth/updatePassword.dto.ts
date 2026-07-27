import { Expose } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @Expose()
  @IsString()
  currentPassword!: string;

  @Expose()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
