import { Expose } from 'class-transformer';
import { IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryValidator } from '../../middlewares/validators/QueryValidator';

export class ProductQueryDto extends PaginationQueryValidator {
  @Expose()
  @IsOptional()
  @IsMongoId()
  category?: string;
}
