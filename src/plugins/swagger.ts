import { swagger } from '@elysiajs/swagger'

// OpenAPI/Swagger dokumantasyon plugin yapilandirmasi
export const swaggerPlugin = swagger({
  documentation: {
    info: {
      title: 'Lift API',
      version: '1.0.0',
      description: 'Lift projesi REST API - Elysia + Bun + PostgreSQL + Drizzle',
    },
    tags: [
      { name: 'auth', description: 'Kimlik dogrulama islemleri' },
      { name: 'categories', description: 'Urun kategori islemleri' },
      { name: 'products', description: 'Urun katalog islemleri' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Mobil/API client icin Authorization: Bearer {accessToken}',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'lift_access_token',
          description: 'Web client icin httpOnly access token cookie',
        },
      },
    },
  },
  path: '/swagger',
})
