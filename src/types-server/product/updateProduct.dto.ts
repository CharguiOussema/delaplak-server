import { Expose, Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsMongoId, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { I18nTextDto } from '../category/i18nText.dto';

export class UpdateProductDto {
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  name?: I18nTextDto;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  description?: I18nTextDto;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @Expose()
  @IsOptional()
  @IsString()
  currency?: string;

  @Expose()
  @IsOptional()
  @IsString()
  dimensions?: string;

  @Expose()
  @IsOptional()
  @IsString()
  thickness?: string;

  @Expose()
  @IsOptional()
  @IsString()
  texture?: string;

  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicationDomains?: string[];

  @Expose()
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  categories?: string[];

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;
}
