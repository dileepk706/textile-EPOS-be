import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import env from '@/config/environment.js';

class TokenSharedService {
  private payLoad: any;
  constructor(payLoad: any) {
    this.payLoad = payLoad;
  }
  signAccessToken = async (): Promise<string> => {
    const token = jwt.sign(this.payLoad, env.ACCESS_SECRET, { expiresIn: env.ACCESS_TTL as any });
    return token;
  };

  signRefreshToken = async (jti: string): Promise<string> => {
    const token = jwt.sign({ ...this.payLoad, jti }, env.REFRESH_SECRET, {
      expiresIn: env.REFRESH_TTL_SEC,
    } as any);
    return token;
  };
}

export const createJti = () => crypto.randomBytes(16).toString('hex');

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export default TokenSharedService;
