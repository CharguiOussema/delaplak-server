import { Expose } from 'class-transformer';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { PHONE_REGEX } from '../common';

export class SignupDto {
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
}
