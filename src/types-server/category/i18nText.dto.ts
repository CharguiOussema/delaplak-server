import { Expose } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

export class I18nTextDto {
  @Expose()
  @IsString()
  @MinLength(1)
  en!: string;

  @Expose()
  @IsString()
  @MinLength(1)
  fr!: string;

  @Expose()
  @IsString()
  @MinLength(1)
  ar!: string;
}
