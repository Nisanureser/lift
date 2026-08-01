# Urun Modulu Dokumantasyonu

Lift API'deki urun (product) modulu; urun CRUD, kategori baglantisi, coklu fotograf yukleme, SKU (birim kodu), olcu birimi ve stok takibi islevlerini kapsar.

---

## Icerik

1. [Genel Bakis](#genel-bakis)
2. [Veritabani Yapisi](#veritabani-yapisi)
3. [SKU ve Birim (Unit)](#sku-ve-birim-unit)
4. [Stok Takibi](#stok-takibi)
5. [Fotograf Yonetimi](#fotograf-yonetimi)
6. [API Endpoint'leri](#api-endpointleri)
7. [Ornek Istekler ve Yanitlar](#ornek-istekler-ve-yanitlar)
8. [Is Kurallari](#is-kurallari)
9. [Hata Kodlari](#hata-kodlari)
10. [Dosya Yapisi](#dosya-yapisi)
11. [Migration Gecmisi](#migration-gecmisi)

---

## Genel Bakis

Urun modulu katmanli mimariye uygun olarak su sekilde organize edilmistir:

```
routes/product.routes.ts
    -> controllers/product.controller.ts
        -> services/product.service.ts   (CRUD, fotograf)
        -> services/stock.service.ts     (stok hareketleri)
            -> database (PostgreSQL + Drizzle ORM)
```

**Public endpoint'ler** (JWT gerekmez):
- Urun listesi
- Urun detayi

**Korumali endpoint'ler** (JWT gerekir):
- Urun olusturma / guncelleme / silme
- Fotograf yukleme / silme
- Stok girisi / cikisi / duzeltme
- Stok hareket gecmisi

Swagger dokumantasyonu: `http://localhost:3000/swagger` (tag: `products`)

---

## Veritabani Yapisi

### `products` tablosu

| Kolon | Tip | Aciklama |
|-------|-----|----------|
| `id` | varchar(128) | CUID primary key |
| `sku` | varchar(100) | Benzersiz birim kodu (unique, zorunlu) |
| `name` | varchar(200) | Urun adi |
| `description` | text | Urun aciklamasi |
| `price` | numeric(12,2) | Birim fiyat |
| `unit` | varchar(50) | Olcu birimi (`piece`, `liter`, vb.) |
| `stock_quantity` | numeric(12,3) | Guncel stok miktari (varsayilan: 0) |
| `category_id` | varchar(128) | FK -> `categories.id` (restrict) |
| `is_active` | boolean | Aktif/pasif durumu |
| `created_by` | varchar(128) | FK -> `users.id` (set null) |
| `created_at` | timestamp | Olusturulma zamani |
| `updated_at` | timestamp | Guncellenme zamani |

### `product_images` tablosu

| Kolon | Tip | Aciklama |
|-------|-----|----------|
| `id` | varchar(128) | CUID primary key |
| `product_id` | varchar(128) | FK -> `products.id` (cascade) |
| `file_name` | varchar(255) | Orijinal dosya adi |
| `file_path` | varchar(500) | Sunucudaki goreceli yol |
| `mime_type` | varchar(100) | MIME tipi |
| `is_primary` | boolean | Kapak fotografi mi |
| `sort_order` | integer | Siralama |
| `created_at` | timestamp | Yukleme zamani |

### `stock_movements` tablosu

| Kolon | Tip | Aciklama |
|-------|-----|----------|
| `id` | varchar(128) | CUID primary key |
| `product_id` | varchar(128) | FK -> `products.id` (cascade) |
| `type` | varchar(20) | Hareket tipi: `in`, `out`, `adjustment` |
| `quantity` | numeric(12,3) | Hareket miktari |
| `previous_stock` | numeric(12,3) | Islem oncesi stok |
| `new_stock` | numeric(12,3) | Islem sonrasi stok |
| `note` | text | Opsiyonel aciklama |
| `created_by` | varchar(128) | FK -> `users.id` (set null) |
| `created_at` | timestamp | Islem zamani |

**Iliskiler:**
- Urun silinince fotograflar ve stok hareketleri otomatik silinir (cascade).
- Kategori silinmek istendiginde bagli urun varsa silme engellenir (`CATEGORY_HAS_PRODUCTS`).

---

## SKU ve Birim (Unit)

### SKU (Stock Keeping Unit / Birim Kodu)

Her urunun benzersiz bir `sku` kodu vardir. Ornekler:

- `YAG-001` — Hidrolik yag
- `KABLO-5M` — 5 metrelik kablo
- `FREN-BALATA-A` — Fren balatasi seti

**Kurallar:**
- Olusturma sirasinda zorunlu
- Max 100 karakter
- Sistem genelinde benzersiz olmali
- Ayni SKU ile ikinci urun olusturulamaz (`409 SKU_EXISTS`)
- Guncelleme sirasinda da benzersizlik kontrolu yapilir
- Arama (`search` query param) SKU uzerinde de calisir

### Birim (Unit)

Urunun hangi olcu biriminde takip edilecegini belirler. Desteklenen degerler:

| API degeri | Turkce karsiligi |
|------------|------------------|
| `piece` | Adet |
| `liter` | Litre |
| `kilogram` | Kilogram |
| `meter` | Metre |
| `box` | Kutu |
| `pack` | Paket |

Sabitler: `src/constants/product.constants.ts` icinde `PRODUCT_UNITS` ve `PRODUCT_UNIT_LABELS`.

Ornek kullanim:
- Hidrolik yag → `liter`
- Fren balatasi → `piece`
- Kablo → `meter`
- Yag filtresi (kutu) → `box`

---

## Stok Takibi

Stok, urun uzerindeki `stockQuantity` alaninda tutulur. Bu alan **dogrudan PATCH ile guncellenmez**; sadece stok endpoint'leri uzerinden degisir. Her degisiklik `stock_movements` tablosuna kaydedilir.

### Stok hareket tipleri

| Tip | Aciklama | Ornek |
|-----|----------|-------|
| `in` | Stok girisi | Tedarikciden 50 litre yag geldi |
| `out` | Stok cikisi | Bakimda 2.5 litre yag kullanildi |
| `adjustment` | Sayim duzeltmesi | Depo sayiminda gercek miktar 47 litre cikti |

### Stok islem akisi

```
Istek (in/out/adjust)
    |
    v
PostgreSQL transaction baslar
    |
    v
Urun satiri FOR UPDATE ile kilitlenir (race condition onlemi)
    |
    v
Onceki stok okunur -> yeni stok hesaplanir
    |
    v
products.stock_quantity guncellenir
    |
    v
stock_movements tablosuna kayit eklenir
    |
    v
Transaction commit -> hareket detayi donulur
```

### Tip bazinda hesaplama

**Giris (`in`):**
```
newStock = previousStock + quantity
movementQuantity = quantity
```

**Cikis (`out`):**
```
if previousStock < quantity -> INSUFFICIENT_STOCK hatasi
newStock = previousStock - quantity
movementQuantity = quantity
```

**Duzeltme (`adjustment`):**
```
newStock = quantity (gelen deger = yeni toplam stok)
movementQuantity = |quantity - previousStock|
```

### Baslangic stogu

Urun olusturulurken opsiyonel `initialStock` gonderilebilir:

1. Urun `stockQuantity: 0` ile olusturulur
2. `initialStock > 0` ise otomatik `stock/in` hareketi yapilir
3. Hareket notu: `"Initial stock"`

---

## Fotograf Yonetimi

- Format: JPEG, PNG, WebP
- Max dosya boyutu: 5 MB
- Urun basina max fotograf: 20 adet
- Dosyalar `uploads/products/{productId}/` altina kaydedilir
- Public erisim: `GET /uploads/products/{productId}/{fileName}`
- Ilk yuklenen fotograf otomatik kapak (`isPrimary: true`) olur
- Urun silinince dosyalar da silinir

`.env` ayarlari:
```
UPLOAD_DIR=uploads
PUBLIC_BASE_URL=http://localhost:3000
```

---

## API Endpoint'leri

### Urun CRUD

| Method | Path | Auth | Aciklama |
|--------|------|------|----------|
| GET | `/products` | Hayir | Sayfalanmis urun listesi |
| GET | `/products/:id` | Hayir | Urun detayi + fotograflar |
| POST | `/products` | Evet | Yeni urun olustur |
| PATCH | `/products/:id` | Evet | Urun bilgilerini guncelle |
| DELETE | `/products/:id` | Evet | Urunu ve fotograflarini sil |

### Fotograf

| Method | Path | Auth | Aciklama |
|--------|------|------|----------|
| POST | `/products/:id/images` | Evet | Coklu fotograf yukle (multipart) |
| DELETE | `/products/:id/images/:imageId` | Evet | Fotograf sil |

### Stok

| Method | Path | Auth | Aciklama |
|--------|------|------|----------|
| POST | `/products/:id/stock/in` | Evet | Stok girisi |
| POST | `/products/:id/stock/out` | Evet | Stok cikisi |
| POST | `/products/:id/stock/adjust` | Evet | Stok duzeltmesi |
| GET | `/products/:id/stock/movements` | Evet | Stok hareket gecmisi |

### Listeleme filtreleri (`GET /products`)

| Query | Tip | Aciklama |
|-------|-----|----------|
| `page` | number | Sayfa (varsayilan: 1) |
| `limit` | number | Sayfa basi kayit (varsayilan: 20, max: 50) |
| `categoryId` | string | Kategoriye gore filtre |
| `search` | string | Ad, SKU veya aciklama icinde arama |
| `isActive` | boolean | Aktif/pasif filtre |

---

## Ornek Istekler ve Yanitlar

### Urun olusturma

```http
POST /products
Authorization: Bearer {accessToken}
Content-Type: application/json
```

```json
{
  "sku": "YAG-001",
  "name": "Hidrolik yag 46",
  "description": "Asansor hidrolik sistemi icin yag",
  "price": "450.00",
  "unit": "liter",
  "categoryId": "clx...",
  "initialStock": "100",
  "isActive": true
}
```

**Yanit (201):**

```json
{
  "id": "clx...",
  "sku": "YAG-001",
  "name": "Hidrolik yag 46",
  "description": "Asansor hidrolik sistemi icin yag",
  "price": "450.00",
  "unit": "liter",
  "stockQuantity": "100.000",
  "categoryId": "clx...",
  "category": {
    "id": "clx...",
    "name": "Yaglar",
    "isActive": true
  },
  "isActive": true,
  "createdBy": "clx...",
  "createdAt": "2026-08-01T10:00:00.000Z",
  "updatedAt": "2026-08-01T10:00:00.000Z",
  "images": []
}
```

### Stok cikisi

```http
POST /products/{id}/stock/out
Authorization: Bearer {accessToken}
Content-Type: application/json
```

```json
{
  "quantity": "5.5",
  "note": "Bakim is emri #1234"
}
```

**Yanit (201):**

```json
{
  "id": "clx...",
  "productId": "clx...",
  "type": "out",
  "quantity": "5.500",
  "previousStock": "100.000",
  "newStock": "94.500",
  "note": "Bakim is emri #1234",
  "createdBy": "clx...",
  "createdAt": "2026-08-01T11:30:00.000Z"
}
```

### Stok duzeltmesi (sayim)

```http
POST /products/{id}/stock/adjust
Authorization: Bearer {accessToken}
Content-Type: application/json
```

```json
{
  "quantity": "47",
  "note": "Aylik depo sayimi"
}
```

### Stok hareket gecmisi

```http
GET /products/{id}/stock/movements?page=1&limit=20
Authorization: Bearer {accessToken}
```

**Yanit (200):**

```json
{
  "data": [
    {
      "id": "clx...",
      "productId": "clx...",
      "type": "out",
      "quantity": "5.500",
      "previousStock": "100.000",
      "newStock": "94.500",
      "note": "Bakim is emri #1234",
      "createdBy": "clx...",
      "createdAt": "2026-08-01T11:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "pages": 1
  }
}
```

### Urun listesi

```http
GET /products?search=YAG&categoryId=clx...&page=1&limit=20
```

**Yanit (200):**

```json
{
  "data": [
    {
      "id": "clx...",
      "sku": "YAG-001",
      "name": "Hidrolik yag 46",
      "description": "...",
      "price": "450.00",
      "unit": "liter",
      "stockQuantity": "94.500",
      "categoryId": "clx...",
      "categoryName": "Yaglar",
      "isActive": true,
      "primaryImage": null,
      "createdAt": "2026-08-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

---

## Is Kurallari

1. **SKU benzersizligi:** Ayni SKU iki urune atanamaz.
2. **Stok dogrudan guncellenmez:** `PATCH /products/:id` body'sinde `stockQuantity` alani yoktur. Stok sadece `/stock/in`, `/stock/out`, `/stock/adjust` ile degisir.
3. **Yetersiz stok kontrolu:** Cikis isleminde mevcut stoktan fazla miktar cikarilamaz.
4. **Transaction guvenligi:** Stok islemleri PostgreSQL transaction icinde `FOR UPDATE` satir kilidi ile yapilir; esanli isteklerde tutarsizlik olmaz.
5. **Kategori zorunlulugu:** Her urunun aktif bir kategoriye bagli olmasi gerekir.
6. **Pasif kategori:** Pasif kategoriye yeni urun eklenemez veya urun o kategoriye tasinamaz.
7. **Miktar formati:** Stok miktarlari string olarak gonderilir, max 3 ondalik basamak desteklenir (ornek: `"5.500"`).
8. **Fiyat formati:** Max 2 ondalik basamak (ornek: `"450.00"`).
9. **Audit trail:** Her stok hareketi kim yapti (`createdBy`), ne kadar (`quantity`), once/sonra (`previousStock` / `newStock`) bilgisiyle kaydedilir.

---

## Hata Kodlari

| HTTP | Kod | Aciklama |
|------|-----|----------|
| 404 | `PRODUCT_NOT_FOUND` | Urun bulunamadi |
| 409 | `SKU_EXISTS` | SKU zaten kullanimda |
| 422 | `INSUFFICIENT_STOCK` | Yetersiz stok (cikis islemi) |
| 422 | `INVALID_STOCK_QUANTITY` | Gecersiz stok miktari (0, negatif, format hatasi) |
| 422 | `INVALID_UNIT` | Gecersiz olcu birimi |
| 422 | `TOO_MANY_IMAGES` | Urun basina 20 fotograf limiti asildi |
| 422 | `INVALID_FILE_TYPE` | Desteklenmeyen fotograf formati |
| 422 | `FILE_TOO_LARGE` | Fotograf 5MB limitini asti |
| 500 | `PRODUCT_CREATE_FAILED` | Urun olusturulamadi |
| 500 | `STOCK_MOVEMENT_FAILED` | Stok hareketi kaydedilemedi |

Ornek hata yaniti:

```json
{
  "error": "Insufficient stock",
  "code": "INSUFFICIENT_STOCK"
}
```

---

## Dosya Yapisi

```
src/
├── constants/
│   ├── product.constants.ts    # Birimler, stok tipleri, fotograf limitleri
│   └── error-codes.ts          # SKU, stok hata kodlari
├── database/schema/
│   ├── products.ts             # Urun tablosu (sku, unit, stockQuantity)
│   ├── product-images.ts       # Fotograf tablosu
│   └── stock-movements.ts      # Stok hareket tablosu
├── dtos/
│   ├── product.dto.ts          # Urun request/response semalari
│   └── stock.dto.ts            # Stok request/response semalari
├── types/
│   ├── product.types.ts        # Urun TypeScript tipleri
│   └── stock.types.ts          # Stok TypeScript tipleri
├── services/
│   ├── product.service.ts      # CRUD, fotograf, SKU kontrolu
│   └── stock.service.ts        # Stok in/out/adjust, hareket listesi
├── controllers/
│   └── product.controller.ts   # HTTP handler'lar
├── routes/
│   └── product.routes.ts       # Endpoint tanimlari
└── utils/
    └── file.util.ts            # Fotograf validasyon ve dosya islemleri

drizzle/
└── 0005_product_sku_unit_stock.sql   # SKU, birim, stok migration
```

---

## Migration Gecmisi

Urun modulu asagidaki migration'larla olusturuldu ve gelistirildi:

| Migration | Aciklama |
|-----------|----------|
| `0000` – `0003` | Auth, kullanici tablolari |
| `0004_refactor_products_categories` | Kategori tablosu, urun refactor (slug/kapasite alanlari kaldirildi) |
| `0005_product_sku_unit_stock` | SKU, unit, stock_quantity kolonlari + stock_movements tablosu |

`0005` migration'i mevcut urunlere otomatik deger atar:
- `sku` = `SKU-{id}`
- `unit` = `piece`
- `stock_quantity` = `0`

Migration calistirmak icin:

```bash
bun run db:migrate
```

---

## Ozet

| Ozellik | Durum |
|---------|-------|
| Urun CRUD | Tamamlandi |
| Kategori baglantisi | Tamamlandi |
| Coklu fotograf yukleme | Tamamlandi |
| SKU (birim kodu) | Tamamlandi |
| Olcu birimi (adet, litre, kg, vb.) | Tamamlandi |
| Stok girisi / cikisi | Tamamlandi |
| Stok sayim duzeltmesi | Tamamlandi |
| Stok hareket gecmisi (audit log) | Tamamlandi |
| Esanli stok islemi korumasi (transaction + row lock) | Tamamlandi |
