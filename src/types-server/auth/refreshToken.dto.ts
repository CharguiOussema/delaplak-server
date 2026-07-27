import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

// refreshToken is optional in the body because web clients deliver it via the
// httpOnly `refreshToken` cookie instead — see auth.service.ts `resolveRefreshTokenValue`.
export class RefreshTokenDto {
  @Expose()
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
