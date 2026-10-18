import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import compression from 'compression';
import httpStatus from 'http-status';
//
import { logger } from '@/shared/logger.js';
import { requestLogger } from '@/shared/middleware/requestLogger.js';
import env from '@/config/environment.js';
import { errorHandler } from '@/shared/middleware/error_handler.js';
import { registerRoutes } from '@/routes/index.js';
import swaggerSpecs from '@/config/swagger.js';
import { getConnectionStatus } from '@/database/connection.js';

class ExpressAppFactory {
  private readonly app: Express;
  private routesConfigured = false;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupSwagger();
    this.setupHealthChecks();
    this.setupModuleRoutes();
  }

  private setupSwagger(): void {
    this.app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpecs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
      }),
    );
    logger.info(`📚 Swagger documentation accessible at /api-docs`);
  }

  private setupMiddleware(): void {
    const configuredOrigins = env.CORS_ORIGIN
      ? env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
      : [];

    const defaultOrigins = [
      'https://textile-epos-fe-mjkd.vercel.app',
      'http://localhost:8086',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173',
      'http://127.0.0.1:8086',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ];

    const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

    this.app.use(
      cors({
        origin: (origin, callback) => {
          // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
          if (!origin) return callback(null, true);

          // Allow wildcard '*' if configured
          if (configuredOrigins.includes('*')) {
            return callback(null, true);
          }

          // Exact origin match
          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }

          // Match Vercel deployment preview domains or local dev ports
          try {
            const parsed = new URL(origin);
            if (
              parsed.hostname.endsWith('.vercel.app') ||
              parsed.hostname === 'localhost' ||
              parsed.hostname === '127.0.0.1'
            ) {
              return callback(null, true);
            }
          } catch {
            // Ignore URL parse errors
          }

          callback(null, false);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        optionsSuccessStatus: 200,
      }),
    );

    this.app.use(
      helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
      }),
    );
    this.app.use(cookieParser());
    this.app.use(requestLogger);
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(compression());
    this.app.use(
      morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }),
    );
  }

  private setupHealthChecks(): void {
    /**
     * @swagger
     * /health:
     *   get:
     *     summary: Basic health check
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Basic health status and MongoDB connection state
     */
    this.app.get('/health', (req: Request, res: Response) => {
      const dbStatus = getConnectionStatus();
      res.status(httpStatus.OK).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: {
          type: 'MongoDB',
          status: dbStatus.state,
          connected: dbStatus.isConnected,
        },
      });
    });

    /**
     * @swagger
     * /api/health:
     *   get:
     *     summary: Detailed API health check
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Detailed API health status including service name, mode, and MongoDB state
     */
    this.app.get('/api/health', (req: Request, res: Response) => {
      const dbStatus = getConnectionStatus();
      res.status(httpStatus.OK).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Textile EPOS Management API',
        origin: env.CORS_ORIGIN,
        mode: env.NODE_ENV || 'no mode',
        database: {
          type: 'MongoDB',
          status: dbStatus.state,
          connected: dbStatus.isConnected,
          dbName: dbStatus.dbName,
          host: dbStatus.host,
        },
      });
    });
  }

  private setupModuleRoutes(): void {
    this.app.use(registerRoutes());
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public getApp = (): Express => this.app;

  public finalizeApp(): Express {
    if (!this.routesConfigured) {
      this.setupErrorHandling();
      this.routesConfigured = true;
    }
    return this.app;
  }
}

export default ExpressAppFactory;
