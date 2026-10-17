import env from '@/config/environment.js';
import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }: any) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  }),
);

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: env.IS_PRODUCTION ? logFormat : devFormat,
  defaultMeta: { service: 'textiles-epos-api' },
  transports: [
    new winston.transports.Console(),
    ...(env.IS_PRODUCTION
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
          }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});
