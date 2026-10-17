import type { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { ApiError } from '@/shared/middleware/error_handler.js';

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const role = req.user?.role;
  console.log('role', role);
  if (role !== 'admin') throw new ApiError('Admin access required.', httpStatus.FORBIDDEN);
  next();
};
