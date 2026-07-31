import { Expose } from 'class-transformer';
import { IsMongoId, IsNumber } from 'class-validator';

export class ProductAttributeSelectionDto {
  @Expose()
  @IsMongoId()
  attribute!: string;

  @Expose()
  @IsMongoId()
  option!: string;

  // Signed on purpose: a chosen option can add to or subtract from the product's base price.
  @Expose()
  @IsNumber()
  priceAdjustment!: number;
}
