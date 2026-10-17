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
    this.app.use(cookieParser());
    this.app.use(requestLogger);
    this.app.use(express.json());
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: env.CORS_ORIGIN,
        credentials: true,
      }),
    );
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
