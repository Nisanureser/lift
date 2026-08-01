# Lift API - Proje Dokumantasyonu

Bu dokuman Lift projesinin klasor yapisi, mimari kararlar ve auth modulunun detayli aciklamasini icerir.

---

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Runtime | Bun |
| Framework | Elysia 1.4 |
| Veritabani | PostgreSQL |
| ORM | Drizzle ORM |
| Validasyon | drizzle-typebox + Elysia TypeBox |
| Auth | @elysiajs/jwt (Bearer token) |
| API Docs | @elysiajs/swagger |
| CORS | @elysiajs/cors |

---

## Proje Agaci

```
lift/
├── src/
│   ├── index.ts                    # Uygulama giris noktasi
│   │
│   ├── config/
│   │   └── env.ts                  # Ortam degiskeni okuma ve dogrulama
│   │
│   ├── database/
│   │   ├── index.ts                # PostgreSQL baglantisi (Drizzle client)
│   │   └── schema/
│   │       ├── index.ts            # Tum tablolari export eder
│   │       └── users.ts            # users tablo tanimi
│   │
│   ├── constants/
│   │   └── error-codes.ts          # Uygulama geneli hata kod sabitleri
│   │
│   ├── types/
│   │   └── auth.types.ts           # Paylasilan TypeScript tipleri
│   │
│   ├── dtos/
│   │   └── auth.dto.ts             # Request/response validasyon semalari
│   │
│   ├── services/
│   │   └── auth.service.ts         # Is mantigi (DB sorgulari, kurallar)
│   │
│   ├── controllers/
│   │   └── auth.controller.ts      # HTTP handler fonksiyonlari
│   │
│   ├── routes/
│   │   ├── index.ts                # Tum route gruplarini birlestirir
│   │   └── auth.routes.ts          # /auth endpoint tanimlari
│   │
│   ├── middlewares/
│   │   └── auth.middleware.ts      # JWT plugin + auth guard
│   │
│   ├── plugins/
│   │   └── swagger.ts              # OpenAPI/Swagger yapilandirmasi
│   │
│   ├── utils/
│   │   ├── errors.util.ts          # AppError sinifi ve hata donusumu
│   │   └── password.util.ts        # Sifre hash/dogrulama (scrypt)
│   │
│   ├── subscribers/                # (ileride) Event listener'lar
│   └── templates/                    # (ileride) Email/HTML sablonlari
│
├── drizzle/                        # Migration SQL dosyalari
├── docs/
│   └── ARCHITECTURE.md             # Bu dosya
├── .env                            # Gizli ortam degiskenleri (git'e gitmez)
├── .env.example                    # .env sablonu
├── drizzle.config.ts               # Drizzle Kit yapilandirmasi
└── package.json
```

---

## Mimari: Katmanli Yapi

Proje **layer-based (katmanli)** mimari kullanir. Her katmanin tek bir sorumlulugu vardir:

```
HTTP Request
    │
    ▼
┌─────────────┐
│   routes/   │  Endpoint tanimi, Swagger metadata, DTO baglama
└──────┬──────┘
       │
       ▼
┌─────────────┐
│controllers/ │  HTTP detaylari: status code, JWT uretimi, response
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ services/   │  Is mantigi, DB sorgulari, business kurallari
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  database/  │  Drizzle schema + PostgreSQL baglantisi
└─────────────┘
```

### Katman Sorumluluklari

| Katman | Ne yapar | Ne yapmaz |
|--------|----------|-----------|
| `routes/` | URL → handler eslestirmesi, Swagger tag/summary | Is mantigi yazmaz |
| `controllers/` | Status code, token uretimi, service cagirma | DB sorgusu yazmaz |
| `services/` | Kayit, login, kullanici bulma gibi is kurallari | HTTP bilgisi bilmez |
| `dtos/` | Gelen/giden veri sekli (validasyon) | Is mantigi icermez |
| `types/` | TypeScript tip tanimlari | Runtime kod icermez |
| `middlewares/` | JWT dogrulama, yetki kontrolu | Endpoint tanimlamaz |
| `utils/` | Tekrar kullanilabilir yardimci fonksiyonlar | Domain mantigi icermez |
| `constants/` | Sabit degerler (hata kodlari, roller vb.) | Fonksiyon icermez |

---

## Istek Akisi Ornegi

`POST /auth/register` istegi geldiginde:

```
1. routes/auth.routes.ts
   └─ RegisterBody ile body validate edilir
   └─ authController.register cagrilir

2. controllers/auth.controller.ts
   └─ authService.registerUser(body) cagrilir
   └─ Donen user icin JWT token uretilir
   └─ set.status = 201, { user, token } donulur

3. services/auth.service.ts
   └─ Email/username cakismasi kontrol edilir
   └─ Sifre hash'lenir (scrypt + salt)
   └─ users tablosuna INSERT yapilir
   └─ password/salt haric SafeUser donulur

4. database/schema/users.ts
   └─ Drizzle users tablo tanimi kullanilir
```

---

## Auth Modulu - Detayli Aciklama

### Veritabani: `users` Tablosu

Dosya: `src/database/schema/users.ts`

| Kolon | Tip | Aciklama |
|-------|-----|----------|
| `id` | varchar(128) | CUID2 ile otomatik uretilen benzersiz ID |
| `username` | varchar(50) | Benzersiz, sadece harf/rakam/_ |
| `email` | varchar(255) | Benzersiz, email formati |
| `password` | varchar(255) | scrypt ile hashlenmis sifre |
| `salt` | varchar(64) | Sifre hash icin rastgele salt |
| `is_active` | boolean | Hesap aktif mi (default: true) |
| `created_at` | timestamp | Olusturulma zamani |
| `updated_at` | timestamp | Guncellenme zamani |

**Guvenlik:** API yanitlarinda `password` ve `salt` alanlari asla donulmez.

---

### Endpoint'ler

#### `POST /auth/register`

Yeni kullanici kaydi.

**Request body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Validasyon kurallari:**
- `username`: 3-50 karakter, sadece `[a-zA-Z0-9_]`
- `email`: gecerli email formati
- `password`: min 8, max 100 karakter

**Basarili yanit (201):**
```json
{
  "user": {
    "id": "clx...",
    "username": "johndoe",
    "email": "john@example.com",
    "isActive": true,
    "createdAt": "2026-08-01T...",
    "updatedAt": "2026-08-01T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Hata yanitlari:**
- `409` — Email veya username zaten kayitli (`USER_EXISTS`)
- `422` — Validasyon hatasi

---

#### `POST /auth/login`

Mevcut kullanici girisi.

**Request body:**
```json
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Basarili yanit (200):**
```json
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Hata yanitlari:**
- `401` — Gecersiz email veya sifre (`INVALID_CREDENTIALS`)
- `422` — Validasyon hatasi

---

#### `GET /auth/me`

Oturum acik kullanicinin profil bilgisi. **Korunan endpoint.**

**Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Basarili yanit (200):**
```json
{
  "user": {
    "id": "clx...",
    "username": "johndoe",
    "email": "john@example.com",
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Hata yanitlari:**
- `401` — Token yok, gecersiz veya suresi dolmus (`UNAUTHORIZED`)

---

### JWT (JSON Web Token)

**Plugin:** `@elysiajs/jwt` — `src/middlewares/auth.middleware.ts`

**Token payload:**
```json
{
  "userId": "clx...",
  "email": "john@example.com",
  "username": "johndoe"
}
```

**Yapilandirma (.env):**
```env
JWT_SECRET="en-az-32-karakter-gizli-anahtar"
JWT_EXPIRES_IN=7d
```

**Kullanim:**
- Register ve login sonrasi token uretilir
- Korunan endpoint'lerde `Authorization: Bearer {token}` header'i gerekir
- `authGuard` middleware token'i dogrular ve `user` bilgisini context'e ekler

---

### Sifre Guvenligi

Dosya: `src/utils/password.util.ts`

| Fonksiyon | Aciklama |
|-----------|----------|
| `createPasswordHash(password)` | Rastgele salt uretir, scrypt ile hashler |
| `hashPassword(password, salt)` | Verilen salt ile scrypt hash |
| `verifyPassword(password, salt, hash)` | timing-safe karsilastirma |

**Algoritma:** scrypt (Node.js crypto modulu)
**Salt:** 32 byte rastgele hex
**Hash uzunlugu:** 64 byte hex

---

### Hata Kodlari

Dosya: `src/constants/error-codes.ts`

| Kod | HTTP | Aciklama |
|-----|------|----------|
| `USER_EXISTS` | 409 | Email veya username zaten kayitli |
| `USER_CREATE_FAILED` | 500 | Kullanici olusturulamadi |
| `INVALID_CREDENTIALS` | 401 | Yanlis email/sifre |
| `UNAUTHORIZED` | 401 | Token eksik, gecersiz veya kullanici pasif |

Hata formati:
```json
{
  "error": "Email or username already registered",
  "code": "USER_EXISTS"
}
```

---

### Auth Dosya Haritasi

```
auth modulu
│
├── dtos/auth.dto.ts
│   ├── RegisterBody      → register body validasyonu
│   ├── LoginBody         → login body validasyonu
│   ├── UserResponse      → guvenli kullanici yaniti semasi
│   └── JwtPayload        → JWT payload semasi
│
├── types/auth.types.ts
│   ├── RegisterInput     → RegisterBody.static tipi
│   ├── LoginInput        → LoginBody.static tipi
│   └── SafeUser          → password/salt haric kullanici tipi
│
├── services/auth.service.ts
│   ├── registerUser()    → kayit is mantigi
│   ├── loginUser()       → giris is mantigi
│   └── getUserById()     → ID ile kullanici bulma
│
├── controllers/auth.controller.ts
│   ├── register()        → HTTP handler: kayit + token
│   ├── login()           → HTTP handler: giris + token
│   └── me()              → HTTP handler: profil donusu
│
├── routes/auth.routes.ts
│   ├── POST /auth/register
│   ├── POST /auth/login
│   └── GET  /auth/me     (authGuard korumali)
│
└── middlewares/auth.middleware.ts
    ├── jwtPlugin         → JWT imzalama/dogrulama
    └── authGuard         → Bearer token kontrolu
```

---

## Diger Endpoint'ler

### `GET /health`

API ve veritabani baglantisinin calistigini dogrular.

**Yanit:**
```json
{
  "status": "ok",
  "timestamp": "2026-08-01T08:00:00.000Z"
}
```

---

## Swagger

- URL: `http://localhost:3000/swagger`
- Sidebar'da endpoint isimleri path olarak gorunur: `/auth/register`, `/auth/login` vb.
- HTTP metodu (POST, GET) sag taraftaki badge'de gosterilir
- JWT korumali endpoint'lerde **Authorize** butonu ile token girilebilir

---

## Ortam Degiskenleri

Dosya: `.env` (proje kokunde, `package.json` ile ayni seviye)

```env
DATABASE_URL=postgresql://postgres:sifre@localhost:5432/lift
JWT_SECRET="en-az-32-karakter-gizli-anahtar"
PORT=3000
NODE_ENV=development
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

**Onemli:** `JWT_SECRET` icinde `#` gibi ozel karakterler varsa tirnak icine al.

---

## Scriptler

```bash
bun run dev          # Gelistirme modu (hot reload)
bun run start        # Normal baslatma
bun run db:generate  # Schema degisikliginden migration SQL uret
bun run db:migrate   # Migration'lari PostgreSQL'e uygula
bun run db:push      # Schema'yi direkt DB'ye push et (dev icin)
bun run db:studio    # Drizzle Studio (web UI ile DB goruntuleme)
```

---

## Yeni Modul Ekleme Rehberi

Ornek: `products` modulu eklemek

```
1. src/database/schema/products.ts     → tablo tanimi
2. src/database/schema/index.ts        → export ekle
3. bun run db:generate && bun run db:migrate

4. src/dtos/product.dto.ts             → validasyon semalari
5. src/types/product.types.ts          → TS tipleri
6. src/services/product.service.ts     → is mantigi
7. src/controllers/product.controller.ts → HTTP handler'lar
8. src/routes/product.routes.ts        → endpoint tanimlari
9. src/routes/index.ts                 → productRoutes ekle
10. src/plugins/swagger.ts             → tag ekle (opsiyonel)
```

---

## Gelecek Fazlar (Plan)

| Faz | Konu | Durum |
|-----|------|-------|
| 1 | Altyapi + Auth | Tamamlandi |
| 2 | RBAC (roller: admin, user) | Bekliyor |
| 3 | Domain modulleri | Bekliyor |
| 4 | Rate limiting, logging | Bekliyor |
| 5 | Test (unit + integration) | Bekliyor |
| 6 | CI/CD pipeline | Bekliyor |

---

## Ozet

Lift API su an calisir durumda bir auth sistemi icerir:

- Katmanli mimari ile olceklenebilir yapi
- JWT tabanli stateless authentication
- scrypt ile guvenli sifre saklama
- Drizzle ORM ile type-safe DB sorgulari
- Swagger ile otomatik API dokumantasyonu
- PostgreSQL (Docker) ile calisir
