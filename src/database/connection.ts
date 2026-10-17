import mongoose from 'mongoose';
import env from '@/config/environment.js';
import { logger } from '@/shared/logger.js';

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

    await mongoose.connect(uri, {
      dbName: env.DB_NAME,
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });

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
