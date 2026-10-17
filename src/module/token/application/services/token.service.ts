import { injectable } from 'tsyringe';
import env from '@/config/environment.js';
import TokenSharedService, { createJti, hashToken } from '@/shared/services/token.shared.service.js';
import RefreshTokenModel from '@/module/token/infrastructure/token.schema.js';

export interface TokenMetadata {
  ip?: string;
  user_agent?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@injectable()
export default class TokenService {
  /**
   * Generates both access token and refresh token, and stores the hashed refresh token in MongoDB.
   */
  async generateAuthTokens(payload: Record<string, any>, meta?: TokenMetadata): Promise<AuthTokens> {
    const jti = createJti();
    const tokenService = new TokenSharedService(payload);

    const accessToken = await tokenService.signAccessToken();
    const refreshToken = await tokenService.signRefreshToken(jti);

    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + env.REFRESH_TTL_SEC * 1000);

    await RefreshTokenModel.create({
      token_hash: tokenHash,
      user_id: payload.user_id ? String(payload.user_id) : '',
      ip: meta?.ip || '',
      user_agent: meta?.user_agent || '',
      expires_at: expiresAt,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Deletes a refresh token from the database by its token hash (used on logout).
   */
  async deleteRefreshTokenByTokenHash(tokenHash: string): Promise<boolean> {
    if (!tokenHash) return false;
    const result = await RefreshTokenModel.deleteOne({ token_hash: tokenHash });
    return result.deletedCount > 0;
  }
}
