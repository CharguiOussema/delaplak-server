import { Expose } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ParseToNumber } from './custom-decorators/ParseNumber';

export class PaginationQueryValidator {
  @IsOptional()
  @Expose()
  @ParseToNumber({ defaultValue: 10, maxNumber: 100 })
  @IsNumber()
  limit!: number;

  @IsOptional()
  @Expose()
  @ParseToNumber({ defaultValue: 1 })
  @IsNumber()
  page!: number;

  @IsOptional()
  @Expose()
  @IsString()
  search?: string;
}
