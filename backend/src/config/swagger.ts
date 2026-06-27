import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'QA Forge API',
      version: '1.0.0',
      description: 'API documentation for QA Forge — AI-Powered Quality Assurance Platform',
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [
    path.resolve(__dirname, '../app.{ts,js}'),
    path.resolve(__dirname, '../api/routes/*.{ts,js}'),
    path.resolve(__dirname, '../api/controllers/*.{ts,js}'),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'QA Forge API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  }));
};
