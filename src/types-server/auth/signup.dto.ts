import { Expose } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @Expose()
  @IsEmail()
  email!: string;

  @Expose()
  @IsString()
  @MinLength(8)
  password!: string;
}
