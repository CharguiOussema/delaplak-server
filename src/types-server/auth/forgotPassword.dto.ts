import { Expose } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @Expose()
  @IsEmail()
  email!: string;
}
