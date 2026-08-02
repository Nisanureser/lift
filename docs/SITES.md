# Tesisler (Sites)

## Basit Anlatim

Bir musterinin **birden fazla binasi / tesisi** olabilir. Ornek: kurumsal musteri "ABC Yonetim"in Kadikoy ve Besiktas subeleri.

- Her tesis bir **musteriye baglidir**.
- Tesis; ad, adres, il, ilce, binadaki yetkili kisi ve not tutar.
- Ziyaret ve asansor (ileride) **tesise** baglanacak, musteriye degil.
- Tum islemler giris gerektirir.

Endpoint yapisi: **`/customers/:id/sites`** — musteri ID'si `:id` olarak gecer (customerId degil).

---

## Yapilanlar (Teknik)

### Endpoint'ler

Tum route'lar `authGuard` arkasinda.

| Metod | Yol | Aciklama |
|-------|-----|----------|
| GET | `/customers/:id/sites` | Musterinin tesis listesi |
| POST | `/customers/:id/sites` | Yeni tesis ekle |
| GET | `/customers/:id/sites/:siteId` | Tesis detayi |
| PATCH | `/customers/:id/sites/:siteId` | Tesis guncelle |
| DELETE | `/customers/:id/sites/:siteId` | Tesis soft delete (204); bagli asansorler de soft delete |

### Liste query

```
GET /customers/{musteri-id}/sites?page=1&limit=20&search=kadikoy&isActive=true
```

### Olusturma body

```json
{
  "name": "Kadikoy Subesi — A Blok",
  "address": "Caferaga Mah. Moda Cad. No:12",
  "city": "Istanbul",
  "district": "Kadikoy",
  "contactName": "Ali Veli",
  "contactPhone": "+905551234567",
  "notes": "Giris B2 katindan",
  "isActive": true
}
```

| Alan | Zorunlu |
|------|---------|
| `name` | Evet (min 2) |
| `address` | Evet (min 3) |
| `city`, `district` | Evet (min 2) |
| `contactName`, `contactPhone`, `notes` | Hayir |
| `isActive` | Hayir (varsayilan true) |

### Musteri silme

Musteriye bagli **silinmemis** tesis varsa `DELETE /customers/:id` → **409** (`CUSTOMER_HAS_SITES`).

### Soft delete

- Tesis silme (`DELETE`) kaydi veritabanindan kaldirmaz; `deleted_at` set eder.
- Tesis silinince o tesise bagli tum asansorler de soft delete olur.
- Silinmis tesisler listelerde ve detay sorgularinda gorunmez.

### Hata kodlari

| Kod | Durum |
|-----|-------|
| `SITE_NOT_FOUND` | 404 |
| `SITE_CREATE_FAILED` | 500 |
| `CUSTOMER_HAS_SITES` | 409 |
| `CUSTOMER_NOT_FOUND` | 404 (musteri yoksa) |

### Veritabani (`sites`)

Migration: `drizzle/0007_sites.sql`

### Ilgili dosyalar

```
src/database/schema/sites.ts
src/dtos/site.dto.ts
src/types/site.types.ts
src/services/site.service.ts
src/controllers/site.controller.ts
src/routes/customer.routes.ts   # tesis route'lari burada
```

Sonraki adim: [ROADMAP.md](./ROADMAP.md) Faz 3 — Asansorler (`/customers/:id/sites/:siteId/elevators` veya benzeri).
