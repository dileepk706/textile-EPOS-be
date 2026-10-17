import dns from 'node:dns';
import mongoose from 'mongoose';
import env from '@/config/environment.js';
import { logger } from '@/shared/logger.js';

// Ensure Node.js DNS resolver can resolve SRV records on Windows/local environments
try {
  const currentServers = dns.getServers();
  if (currentServers.length === 0 || currentServers.includes('127.0.0.1')) {
    dns.setServers(['8.8.8.8', '1.1.1.1', ...currentServers.filter(s => s !== '127.0.0.1')]);
  }
} catch {
  // Ignore DNS configuration errors if restricted
}

export const CONNECTION_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export const getConnectionStatus = () => {
  const readyState = mongoose.connection.readyState;
  return {
    isConnected: readyState === 1,
    state: CONNECTION_STATES[readyState] || 'unknown',
    readyState,
    host: mongoose.connection.host || undefined,
    port: mongoose.connection.port || undefined,
    dbName: mongoose.connection.name || undefined,
  };
};

export const connectDB = async (uri: string = env.MONGODB_URI): Promise<typeof mongoose> => {
  if (mongoose.connection.readyState === 1) {
    logger.info('MongoDB is already connected.');
    return mongoose;
  }

  try {
    mongoose.connection.on('connected', () => {
      logger.info(
        `🍃 MongoDB connected successfully to database: [${mongoose.connection.name}] at ${mongoose.connection.host}:${mongoose.connection.port}`,
      );
    });

    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB connection disconnected');
    });

    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        attempt++;
        await mongoose.connect(uri, {
          dbName: env.DB_NAME,
          autoIndex: true,
          serverSelectionTimeoutMS: 8000,
        });
        return mongoose;
      } catch (err) {
        if (attempt >= maxRetries) {
          throw err;
        }
        logger.warn(`⚠️ MongoDB connection attempt ${attempt} failed (${(err as Error).message}). Retrying in 1.5s...`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    return mongoose;
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('🍃 MongoDB disconnected gracefully');
  }
};

export { mongoose };

// Support both function-style and property-style default imports
const connectionModule = Object.assign(connectDB, {
  connectDB,
  disconnectDB,
  getConnectionStatus,
  mongoose,
});

export default connectionModule;
