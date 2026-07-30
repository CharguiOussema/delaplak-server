import { Expose } from 'class-transformer';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class I18nTextDto {
  @Expose()
  @IsOptional()
  @IsString()
  @MinLength(1)
  en?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @MinLength(1)
  fr?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @MinLength(1)
  ar?: string;
}
