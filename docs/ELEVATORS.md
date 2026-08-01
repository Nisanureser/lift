# Asansorler (Elevators)

## Basit Anlatim

Her tesisin **birden fazla asansoru** olabilir. Ornek: "A Blok — 1 nolu asansor", marka/model, seri numarasi, kapasite.

- Her asansor bir **tesise baglidir** (`/customers/:id/sites/:siteId` altinda).
- Durum: `active`, `inactive`, `faulty`.
- Silme islemleri **soft delete** — kayit veritabaninda kalir, listelerde gorunmez.
- Tum islemler giris gerektirir.

Endpoint yapisi: **`/customers/:id/sites/:siteId/elevators`**

---

## Yapilanlar (Teknik)

### Endpoint'ler

Tum route'lar `authGuard` arkasinda (`customer.routes.ts` icinde).

| Metod | Yol | Aciklama |
|-------|-----|----------|
| GET | `/customers/:id/sites/:siteId/elevators` | Tesisin asansor listesi |
| POST | `/customers/:id/sites/:siteId/elevators` | Yeni asansor ekle |
| GET | `/customers/:id/sites/:siteId/elevators/:elevatorId` | Asansor detayi |
| PATCH | `/customers/:id/sites/:siteId/elevators/:elevatorId` | Asansor guncelle |
| DELETE | `/customers/:id/sites/:siteId/elevators/:elevatorId` | Soft delete (204) |

### Liste query

```
GET /customers/{musteri-id}/sites/{site-id}/elevators?page=1&limit=20&search=otis&status=active&isActive=true
```

### Olusturma body

```json
{
  "label": "A Blok — 1 nolu asansor",
  "brand": "Otis",
  "model": "Gen2",
  "serialNumber": "OT-123456",
  "capacity": "630 kg / 8 kisi",
  "installedAt": "2020-06-15T00:00:00.000Z",
  "status": "active",
  "notes": "Son muayene 2025",
  "isActive": true
}
```

| Alan | Zorunlu |
|------|---------|
| `label` | Evet (min 2) |
| `brand`, `model`, `serialNumber`, `capacity` | Hayir |
| `installedAt`, `status`, `notes`, `isActive` | Hayir |

### Durum degerleri

| Deger | Anlam |
|-------|-------|
| `active` | Calisir durumda |
| `inactive` | Devre disi |
| `faulty` | Ariza / arızali |

### Soft delete

- `DELETE` istegi `deleted_at` alanini doldurur; satir silinmez.
- Tesis silindiginde (`DELETE /customers/:id/sites/:siteId`) bagli tum asansorler de soft delete olur.
- Ayni seri numarasi soft delete sonrasi tekrar kullanilabilir (partial unique index).

### Hata kodlari

| Kod | Durum |
|-----|-------|
| `ELEVATOR_NOT_FOUND` | 404 |
| `ELEVATOR_CREATE_FAILED` | 500 |
| `INVALID_ELEVATOR_STATUS` | 422 |
| `SERIAL_NUMBER_EXISTS` | 409 |
| `SITE_NOT_FOUND` | 404 (tesis yoksa) |
| `CUSTOMER_NOT_FOUND` | 404 (musteri yoksa) |

### Veritabani (`elevators`)

Migration: `drizzle/0008_soft_delete_elevators.sql` (elevators tablosu + tum modullere `deleted_at`)

### Ilgili dosyalar

```
src/constants/elevator.constants.ts
src/database/schema/elevators.ts
src/dtos/elevator.dto.ts
src/types/elevator.types.ts
src/services/elevator.service.ts
src/controllers/elevator.controller.ts
src/routes/customer.routes.ts
src/utils/soft-delete.util.ts
```
