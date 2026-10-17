import { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/logger.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  res.on('finish', () => {
    const { method, originalUrl } = req;
    const { statusCode } = res;

    if (statusCode >= 500) {
      logger.error(`[${method}] ${originalUrl} - Status: ${statusCode}`);
    } else if (statusCode >= 400) {
      logger.warn(`[${method}] ${originalUrl} - Status: ${statusCode}`);
    } else {
      logger.info(`[${method}] ${originalUrl} - Status: ${statusCode}`);
    }
  });

  next();
};
