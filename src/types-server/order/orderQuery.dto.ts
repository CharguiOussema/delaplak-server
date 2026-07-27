import { Expose } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryValidator } from '../../middlewares/validators/QueryValidator';
import { ORDER_STATUS } from '../../types/consts';

export class OrderQueryDto extends PaginationQueryValidator {
  @Expose()
  @IsOptional()
  @IsEnum(ORDER_STATUS)
  status?: ORDER_STATUS;
}
