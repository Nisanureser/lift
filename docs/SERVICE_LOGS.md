# Servis Kayitlari (Service Logs)

## Basit Anlatim

Teknisyen sahaya gittikten sonra **ne yapti** burada kaydedilir. Is emri kapanirken veya acil ariza icin dogrudan servis kaydi acilabilir.

- Is emri olmadan da kayit acilabilir (acil ariza senaryosu).
- Her ziyaret ayri satir; asansor `notes` alanina yazilmaz.
- Fotograflar MinIO uzerinde saklanir.
- Kullanilan parcalar servis kaydina baglanir ve stoktan dusulur.

---

## Yapilanlar (Teknik)

### Endpoint'ler

| Metod | Yol | Aciklama |
|-------|-----|----------|
| POST | `/service-logs` | Ad-hoc servis kaydi (is emri olmadan) |
| GET | `/service-logs/:id` | Servis kaydi detayi |
| PATCH | `/service-logs/:id` | Servis kaydini guncelle |
| DELETE | `/service-logs/:id` | Soft delete (204) |
| POST | `/service-logs/:id/photos` | Fotograf yukle (multipart) |
| GET | `/service-logs/:id/parts` | Kullanilan parcalar |
| POST | `/service-logs/:id/parts` | Parca ekle (stok duser) |
| POST | `/work-orders/:id/complete` | Is emrini kapat + servis kaydi |
| GET | `/customers/:id/sites/:siteId/elevators/:elevatorId/history` | Asansor servis gecmisi |

### Ad-hoc olusturma body

```json
{
  "elevatorId": "elevator-id",
  "workOrderId": "work-order-id",
  "arrivedAt": "2026-08-05T10:00:00.000Z",
  "leftAt": "2026-08-05T11:00:00.000Z",
  "summary": "Acil ariza mudahalesi",
  "workPerformed": "Kapi sensoru degistirildi",
  "checklist": { "halat": true, "kapi": false },
  "result": "needs_followup",
  "followUpNotes": "1 hafta sonra tekrar kontrol",
  "parts": [
    { "productId": "product-id", "quantity": "1" }
  ]
}
```

| Alan | Zorunlu |
|------|---------|
| `elevatorId` | Evet |
| Diger alanlar | Hayir |

### Sonuc degerleri (`result`)

| Deger | Anlam |
|-------|-------|
| `ok` | Sorun yok |
| `needs_followup` | Takip gerekli |
| `critical` | Kritik durum |

### Fotograf yukleme

```
POST /service-logs/{id}/photos
Content-Type: multipart/form-data

file: (jpeg/png/webp, max 5MB)
```

Servis kaydi basina en fazla 10 fotograf.

### Asansor gecmisi query

```
GET /customers/{musteri-id}/sites/{site-id}/elevators/{elevator-id}/history?page=1&limit=20&result=ok
```

### Not alanlari

| Alan | Amac |
|------|------|
| `summary` | Kisa ozet |
| `workPerformed` | Yapilan isler (serbest metin) |
| `followUpNotes` | Sonraki ziyaret icin uyari |
| `checklist` | JSON — madde madde kontrol (opsiyonel) |

### Hata kodlari

| Kod | Durum |
|-----|-------|
| `SERVICE_LOG_NOT_FOUND` | 404 |
| `SERVICE_LOG_CREATE_FAILED` | 500 |
| `INVALID_SERVICE_LOG_RESULT` | 422 |
| `TOO_MANY_SERVICE_LOG_PHOTOS` | 422 |
| `INSUFFICIENT_STOCK` | 422 (parca eklerken) |

### Ilgili dosyalar

- Schema: `src/database/schema/service-logs.ts`, `service-log-photos.ts`
- Service: `src/services/service-log.service.ts`
- Routes: `src/routes/service-log.routes.ts`
