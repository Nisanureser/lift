import { swagger } from '@elysiajs/swagger'

// OpenAPI/Swagger dokumantasyon plugin yapilandirmasi
export const swaggerPlugin = swagger({
  documentation: {
    info: {
      title: 'Lift API',
      version: '1.0.0',
      description: 'Lift projesi REST API - Elysia + Bun + PostgreSQL + Drizzle',
    },
    tags: [{ name: 'auth', description: 'Kimlik dogrulama islemleri' }],
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
  path: '/swagger',
})
