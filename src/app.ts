import ExpressAppFactory from '@/shared/factories/express.app.factory.js';
import env from '@/config/environment.js';
import { logger } from '@/shared/logger.js';
import { connectDB, disconnectDB } from '@/database/connection.js';
import { seedDatabase } from '@/database/seed.js';

class App {
  private readonly expressAppFactory: ExpressAppFactory;
  private server: any;

  constructor() {
    this.expressAppFactory = new ExpressAppFactory();
  }

  public async start(): Promise<void> {
    try {
      await connectDB();
      await seedDatabase();

      this.expressAppFactory.finalizeApp();
      const app = this.expressAppFactory.getApp();

      this.server = app.listen(env.PORT, () => {
        logger.info(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      });

      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);

      if (this.server) {
        this.server.close(async () => {
          try {
            await disconnectDB();
            logger.info('✅ Process terminated gracefully');
            process.exit(0);
          } catch (err) {
            logger.error('Error during database disconnect:', err);
            process.exit(1);
          }
        });
      } else {
        await disconnectDB();
        process.exit(0);
      }

      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  public getExpressApp() {
    return this.expressAppFactory.getApp();
  }
}

export default App;
