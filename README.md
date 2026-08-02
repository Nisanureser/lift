# Lift

Asansor / teknik malzeme envanter ve katalog yonetimi icin REST API.

Bun + Elysia + PostgreSQL + Drizzle ORM + MinIO.

---

## Ne yapar?

- Kullanici kayit ve giris (cookie tabanli oturum)
- Urun kategorileri
- Bireysel ve kurumsal musteriler
- Musteri tesis / bina kayitlari
- Urun katalogu (SKU, fiyat, birim, aciklama)
- Coklu urun fotografi (MinIO)
- Stok giris / cikis / duzeltme ve hareket gecmisi

Giris yapmadan yalnizca kayit, giris, token yenileme, cikis ve `/health` aciktir. Diger her sey oturum gerektirir.

---

## Hizli baslangic

### 1. Ortam dosyasi

```bash
cp .env.example .env
```

`.env` icinde en az su alanlari duzenle:

- `DATABASE_URL` — PostgreSQL baglanti adresi
- `JWT_SECRET` — en az 32 karakter

### 2. Altyapi (PostgreSQL + MinIO)

Docker Desktop acik olmali.

```bash
docker compose up -d
```

Docker Desktop'ta **lift** projesi altinda su servisler calisir:

```
lift
├── postgres    → localhost:5432  (postgres / postgres, db: lift)
├── minio       → localhost:9000  (API), :9001 (Console)
└── minio-init  → bucket olusturur, sonra kapanir
```

MinIO Console: http://localhost:9001 (`minioadmin` / `minioadmin`)

`.env` icindeki `DATABASE_URL` docker ile uyumlu olmali:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/lift
```

### 3. Bagimliliklar ve veritabani

```bash
bun install
bun run db:migrate
```

### 4. API

```bash
bun run dev
```

| Adres | Aciklama |
|-------|----------|
| http://localhost:3000 | API |
| http://localhost:3000/swagger | Swagger UI |
| http://localhost:3000/health | Saglik kontrolu |

---

## Gunluk calisma

Her oturumda sirayla:

```bash
docker compose up -d    # postgres + minio
bun run dev             # API
```
```

MinIO kapaliysa API baslarken bekler veya hata verir.

---

## Dokumantasyon

Detayli modul anlatimlari `docs/` klasorunde. Her dosyada once sade dilde ozet, sonra teknik detay vardir.

| Modul | Dosya |
|-------|-------|
| Giris / kayit | [docs/AUTH.md](./docs/AUTH.md) |
| Kategoriler | [docs/CATEGORIES.md](./docs/CATEGORIES.md) |
| Musteriler | [docs/CUSTOMERS.md](./docs/CUSTOMERS.md) |
| Tesisler | [docs/SITES.md](./docs/SITES.md) |
| Yol haritasi (tesis, asansor, ziyaret) | [docs/ROADMAP.md](./docs/ROADMAP.md) |
| Urunler ve fotograflar | [docs/PRODUCTS.md](./docs/PRODUCTS.md) |
| Stok | [docs/STOCK.md](./docs/STOCK.md) |
| MinIO depolama | [docs/STORAGE.md](./docs/STORAGE.md) |
| Mobil test (nginx) | [docs/NGINX.md](./docs/NGINX.md) |
| Indeks | [docs/README.md](./docs/README.md) |

---

## Proje yapisi

```
src/
├── index.ts              # Ana uygulama, /health, /uploads proxy
├── config/env.ts         # Ortam degiskenleri
├── routes/               # auth, categories, products
├── controllers/          # HTTP katmani
├── services/             # Is mantigi
├── middlewares/          # authGuard
├── dtos/                 # Istek/yanit semalari
├── database/schema/      # Drizzle tablolari
└── utils/                # Yardimci fonksiyonlar

docker-compose.yml        # MinIO
drizzle/                  # SQL migration'lar
docs/                     # Modul dokumantasyonu
```

---

## Scriptler

| Komut | Aciklama |
|-------|----------|
| `bun run dev` | Gelistirme (hot reload) |
| `bun run start` | Production baslat |
| `bun run db:migrate` | Migration calistir |
| `bun run db:generate` | Migration uret |
| `bun run db:studio` | Drizzle Studio |

---

## Web istemci notu

Cookie auth icin tum isteklerde:

```ts
fetch('/products', { credentials: 'include' })
```

CORS'ta `credentials: true` ve `CORS_ORIGIN` icinde frontend adresin tanimli olmali (`*` cookie ile calismaz).

Mobil / Bearer:

```
Authorization: Bearer {accessToken}
```

---

## Teknolojiler

- [Bun](https://bun.sh) — runtime
- [Elysia](https://elysiajs.com) — web framework
- [Drizzle ORM](https://orm.drizzle.team) — veritabani
- [PostgreSQL](https://www.postgresql.org)
- [MinIO](https://min.io) — S3 uyumlu object storage
- [@aws-sdk/client-s3](https://www.npmjs.com/package/@aws-sdk/client-s3) — MinIO istemcisi
