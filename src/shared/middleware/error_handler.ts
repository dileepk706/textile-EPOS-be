import env from '@/config/environment.js';
import { logger } from '@/shared/logger.js';
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';

export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: any[];
}

export class ApiError extends Error implements AppError {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: any[];

  constructor(
    message: string,
    statusCode: number = httpStatus.INTERNAL_SERVER_ERROR,
    errors?: any[],
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction): void => {
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message: string | string[] = 'Internal Server Error';

  if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.message) {
    message = err.message;
  }

  // If validation errors exist, convert message into a string array of those error messages
  if (err.errors && err.errors.length > 0) {
    message = err.errors.map((e: any) => e.message);
  }

  // logger.error('Validation error:', req.originalUrl, {
  //   error: {
  //     message,
  //     stack: err.stack,
  //     statusCode,
  //     name: err.name,
  //     ...(err.constructor?.name && { type: err.constructor.name }),
  //   },
  //   request: {
  //     method: req.method,
  //     url: req.originalUrl,
  //     ip: req.ip,
  //     userAgent: req.get('User-Agent'),
  //   },
  // });

  logger.error(err);

  res.status(statusCode).json({
    status: 'error',
    message,
    errors: err.errors || [],
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
};
