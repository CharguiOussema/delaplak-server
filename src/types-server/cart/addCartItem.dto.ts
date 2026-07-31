import { Expose, Type } from 'class-transformer';
import { IsArray, IsInt, IsMongoId, IsOptional, Min, ValidateNested } from 'class-validator';
import { SelectedOptionDto } from './selectedOption.dto';

export class AddCartItemDto {
  @Expose()
  @IsMongoId()
  product!: string;

  @Expose()
  @IsInt()
  @Min(1)
  quantity!: number;

  @Expose()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedOptionDto)
  selectedOptions?: SelectedOptionDto[];
}
