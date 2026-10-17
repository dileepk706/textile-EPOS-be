import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { clearCookieHandler, cookieHandler, sendSuccess } from '@/shared/response_handler.js';
import TokenService from '@/module/token/application/services/token.service.js';
import IUserService from '@/module/user/domain/interfaces/user.services.interface.js';
import IUserAuthController from '@/module/user/domain/interfaces/user.auth.controller.interface.js';
import { hashToken } from '@/shared/services/token.shared.service.js';
import TextileModel from '@/module/textile/infrastructure/textile.schema.js';

@injectable()
class UserAuthController implements IUserAuthController {
  constructor(
    @inject('ITokenService') private readonly tokenService: TokenService,
    @inject('IUserService') private readonly userService: IUserService,
  ) {}

  login = async (req: Request, res: Response) => {
    const result = await this.userService.validate(req.body);

    let textileId = result.textile_id || result.textiles_id || null;
    let tenantId = result.tenant_id || null;

    if (!textileId) {
      const defaultTextile = await TextileModel.findOne({ is_active: true });
      if (defaultTextile) {
        textileId = defaultTextile._id ? defaultTextile._id.toString() : defaultTextile.id;
        tenantId = tenantId || textileId;
      }
    }

    const payLoad = {
      user_id: result.id || result._id,
      email: result.email,
      role: String(result.role || result.user_type || 'CASHIER').toUpperCase(),
      tenant_id: tenantId || textileId,
      textile_id: textileId,
    };

    const { accessToken, refreshToken } = await this.tokenService.generateAuthTokens(payLoad, {
      ip: req.ip || '',
      user_agent: req.get('User-Agent') || '',
    });

    cookieHandler(res, { refreshToken }, 'refresh_token');

    return sendSuccess(
      res,
      {
        accessToken,
        refreshToken,
        user: {
          ...result,
          textile_id: textileId,
          textiles_id: textileId,
          tenant_id: tenantId || textileId,
        },
      },
      'User logged in successfully',
      httpStatus.OK,
    );
  };

  logout = async (req: Request, res: Response) => {
    const token = req.cookies?.refresh_token || req.body.refresh_token;
    if (token) {
      await this.tokenService.deleteRefreshTokenByTokenHash(hashToken(token));
    }
    clearCookieHandler(res, 'refresh_token');
    return sendSuccess(res, {}, 'Logged out successfully', httpStatus.OK);
  };
}

export default UserAuthController;
