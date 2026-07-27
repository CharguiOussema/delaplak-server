import { Expose } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @Expose()
  @IsEmail()
  email!: string;

  @Expose()
  @IsString()
  @MinLength(1)
  password!: string;
}
