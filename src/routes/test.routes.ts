import { Router, Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { getConnectionStatus } from '@/database/connection.js';
import asyncHandler from '@/shared/middleware/async_handler.js';

const testRouter = Router();

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Test server and MongoDB status
 *     tags: [Testing]
 *     responses:
 *       200:
 *         description: Server and MongoDB are operational
 *       503:
 *         description: MongoDB is not connected
 */
testRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const startTime = Date.now();
    const dbStatus = getConnectionStatus();

    let pingSuccess = false;
    let pingLatencyMs: number | null = null;
    let pingError: string | null = null;

    if (dbStatus.isConnected && mongoose.connection.db) {
      try {
        const pingStart = Date.now();
        await mongoose.connection.db.admin().ping();
        pingLatencyMs = Date.now() - pingStart;
        pingSuccess = true;
      } catch (err: any) {
        pingError = err?.message || 'Failed to ping MongoDB';
      }
    }

    const totalResponseTimeMs = Date.now() - startTime;
    const isHealthy = dbStatus.isConnected && pingSuccess;

    const responsePayload = {
      success: isHealthy,
      message: isHealthy
        ? 'Server is running and MongoDB is connected successfully!'
        : 'Server is running, but MongoDB connection has issues.',
      data: {
        server: {
          status: 'online',
          uptime: `${Math.floor(process.uptime())}s`,
          timestamp: new Date().toISOString(),
          nodeVersion: process.version,
        },
        database: {
          type: 'MongoDB',
          connected: dbStatus.isConnected,
          state: dbStatus.state,
          dbName: dbStatus.dbName,
          host: dbStatus.host,
          port: dbStatus.port,
          pingSuccess,
          pingLatencyMs: pingLatencyMs !== null ? `${pingLatencyMs}ms` : null,
          pingError,
        },
        responseTime: `${totalResponseTimeMs}ms`,
      },
    };

    const statusCode = isHealthy ? httpStatus.OK : httpStatus.SERVICE_UNAVAILABLE;
    res.status(statusCode).json(responsePayload);
  }),
);

/**
 * @swagger
 * /api/test/db:
 *   get:
 *     summary: Perform end-to-end MongoDB write, read, and delete test
 *     tags: [Testing]
 *     responses:
 *       200:
 *         description: Database CRUD operation test succeeded
 */
testRouter.get(
  '/db',
  asyncHandler(async (_req: Request, res: Response) => {
    const dbStatus = getConnectionStatus();

    if (!dbStatus.isConnected || !mongoose.connection.db) {
      res.status(httpStatus.SERVICE_UNAVAILABLE).json({
        success: false,
        message: 'MongoDB is not connected. Cannot perform database test.',
        database: dbStatus,
      });
      return;
    }

    const testStartTime = Date.now();
    const testCollection = mongoose.connection.db.collection('_connection_test');
    const testPayload = {
      test: 'mongodb_connection_verification',
      message: 'MongoDB is fully operational for Textile EPOS',
      createdAt: new Date(),
    };

    // 1. Insert test document
    const insertResult = await testCollection.insertOne(testPayload);

    // 2. Read test document back
    const foundDoc = await testCollection.findOne({ _id: insertResult.insertedId });

    // 3. Delete test document (clean up)
    await testCollection.deleteOne({ _id: insertResult.insertedId });

    const durationMs = Date.now() - testStartTime;

    res.status(httpStatus.OK).json({
      success: true,
      message: 'MongoDB write, read, and cleanup test executed successfully!',
      data: {
        operation: 'CRUD test (insert, find, delete)',
        insertedId: insertResult.insertedId,
        verifiedDocument: foundDoc,
        databaseName: dbStatus.dbName,
        duration: `${durationMs}ms`,
      },
    });
  }),
);

export default testRouter;
