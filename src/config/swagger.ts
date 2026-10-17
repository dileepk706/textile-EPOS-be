import swaggerJsDoc, { Options } from 'swagger-jsdoc';
import env from '@/config/environment.js';

const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Textile EPOS API',
      version: '1.0.0',
      description: 'API documentation for Textile EPOS application with MongoDB.',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your Bearer token in the format: Bearer <token>',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Document all routes under src/shared, src/routes, and src/module
  apis: [
    './src/shared/factories/express.app.factory.{ts,js}',
    './src/routes/*.{ts,js}',
    './src/module/**/interfaces/*.routes.{ts,js}',
    './src/module/**/interfaces/routes/*.routes.{ts,js}',
    './dist/shared/factories/express.app.factory.js',
    './dist/routes/*.js',
    './dist/module/**/interfaces/*.routes.js',
    './dist/module/**/interfaces/routes/*.routes.js',
  ],
};

const swaggerSpecs = swaggerJsDoc(swaggerOptions);

export default swaggerSpecs;
