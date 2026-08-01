# Lift API

Elysia + Bun + PostgreSQL + Drizzle ORM ile gelistirilen REST API.

Detayli proje dokumantasyonu: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

## Hizli Baslangic

```bash
cp .env.example .env        # Ortam degiskenlerini duzenle
docker compose up -d        # MinIO object storage
bun install
bun run db:migrate          # Ilk kurulumda bir kez
bun run dev
```

MinIO Console: http://localhost:9001 (`minioadmin` / `minioadmin`)

Swagger: http://localhost:3000/swagger

