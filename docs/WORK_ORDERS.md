# Is Emirleri (Work Orders)

## Basit Anlatim

Ofisin planladigi saha isleri burada tutulur. "Yarin su asansore gidilecek" kaydi acilir, teknisyene atanir, durum takip edilir.

- Her is emri **tek bir asansore** baglidir.
- Durum akisi: `planned` → `assigned` → `in_progress` → `completed` (veya `cancelled` / `postponed`).
- Is emri kapanirken servis kaydi olusturulur (`POST /work-orders/:id/complete`).
- Silme islemleri **soft delete** — kayit veritabaninda kalir.

Endpoint yapisi: **`/work-orders`**

---

## Yapilanlar (Teknik)

### Endpoint'ler

Tum route'lar `authGuard` arkasinda.

| Metod | Yol | Aciklama |
|-------|-----|----------|
| GET | `/work-orders` | Is emri listesi (filtre + sayfalama) |
| POST | `/work-orders` | Yeni is emri olustur |
| GET | `/work-orders/:id` | Is emri detayi |
| PATCH | `/work-orders/:id` | Is emri guncelle |
| PATCH | `/work-orders/:id/status` | Durum gecisi |
| POST | `/work-orders/:id/complete` | Tamamla + servis kaydi olustur |
| DELETE | `/work-orders/:id` | Soft delete (204) |

### Liste query

```
GET /work-orders?page=1&limit=20&status=assigned&assignedTo={user-id}&customerId={musteri-id}&priority=urgent&type=breakdown&scheduledFrom=2026-01-01&scheduledTo=2026-12-31&search=halat
```

### Olusturma body

```json
{
  "elevatorId": "elevator-id",
  "assignedTo": "user-id",
  "contractId": "contract-id",
  "type": "periodic_maintenance",
  "priority": "normal",
  "scheduledAt": "2026-08-05T09:00:00.000Z",
  "description": "Aylik periyodik bakim",
  "internalNotes": "Anahtar guvenlikte"
}
```

| Alan | Zorunlu |
|------|---------|
| `elevatorId` | Evet |
| `type` | Evet |
| `assignedTo`, `contractId`, `priority`, `scheduledAt`, `description`, `internalNotes` | Hayir |

### Tip degerleri (`type`)

| Deger | Anlam |
|-------|-------|
| `periodic_maintenance` | Periyodik bakim |
| `breakdown` | Ariza |
| `inspection` | Muayene / kontrol |
| `installation` | Montaj |

### Durum degerleri (`status`)

| Deger | Anlam |
|-------|-------|
| `planned` | Planlandi, teknisyen atanmamis olabilir |
| `assigned` | Teknisyene atandi |
| `in_progress` | Sahada devam ediyor |
| `completed` | Tamamlandi |
| `cancelled` | Iptal |
| `postponed` | Ertelendi |

### Oncelik (`priority`)

| Deger | Anlam |
|-------|-------|
| `low` | Dusuk |
| `normal` | Normal |
| `urgent` | Acil |

### Durum gecis kurallari

```
planned → assigned | cancelled | postponed
assigned → in_progress | cancelled | postponed
in_progress → completed | cancelled | postponed
postponed → planned | assigned | cancelled
completed → (geri donus yok)
```

`assignedTo` ataninca otomatik `planned` → `assigned` gecisi yapilir.

### Tamamlama body

```json
{
  "arrivedAt": "2026-08-05T10:00:00.000Z",
  "leftAt": "2026-08-05T11:30:00.000Z",
  "summary": "Periyodik bakim tamamlandi",
  "workPerformed": "Halat kontrol edildi, kapi sensoru temizlendi",
  "result": "ok",
  "followUpNotes": "6 ay sonra halat tekrar kontrol",
  "parts": [
    { "productId": "product-id", "quantity": "1" }
  ]
}
```

### Hata kodlari

| Kod | Durum |
|-----|-------|
| `WORK_ORDER_NOT_FOUND` | 404 |
| `WORK_ORDER_CREATE_FAILED` | 500 |
| `INVALID_WORK_ORDER_STATUS` | 422 |
| `INVALID_WORK_ORDER_TYPE` | 422 |
| `INVALID_WORK_ORDER_PRIORITY` | 422 |
| `WORK_ORDER_ALREADY_COMPLETED` | 422 |
| `ASSIGNED_USER_NOT_FOUND` | 404 |
| `ELEVATOR_NOT_FOUND` | 404 |
| `CONTRACT_NOT_FOUND` | 404 |

### Ilgili dosyalar

- Schema: `src/database/schema/work-orders.ts`
- Service: `src/services/work-order.service.ts`
- Routes: `src/routes/work-order.routes.ts`
