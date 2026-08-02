# Parca Tuketimi (Service Parts)

## Basit Anlatim

Teknisyen sahada hangi parcayi kullandiysa burada kaydedilir ve **stok otomatik duser**.

- Parca ekleme islemi mevcut stok modulu ile entegredir.
- Her parca kaydi bir servis kaydina baglidir.
- Stok yetersizse islem reddedilir.

Detay: [STOCK.md](./STOCK.md)

---

## Yapilanlar (Teknik)

### Endpoint'ler

| Metod | Yol | Aciklama |
|-------|-----|----------|
| GET | `/service-logs/:id/parts` | Servis kaydindaki parcalar |
| POST | `/service-logs/:id/parts` | Parca ekle + stok cikisi |
| (complete) | `POST /work-orders/:id/complete` | `parts[]` ile toplu ekleme |
| (ad-hoc) | `POST /service-logs` | `parts[]` ile toplu ekleme |

### Parca ekleme body

```json
{
  "productId": "product-id",
  "quantity": "1"
}
```

`quantity` string; en fazla 3 ondalik (`"2.500"`).

### Complete / ad-hoc icinde parca dizisi

```json
{
  "summary": "Kapi sensoru degisti",
  "parts": [
    { "productId": "product-id-1", "quantity": "1" },
    { "productId": "product-id-2", "quantity": "2.5" }
  ]
}
```

### Yanit ornegi (parca listesi)

```json
{
  "data": [
    {
      "id": "...",
      "productId": "...",
      "productName": "Kapi Sensoru",
      "productSku": "KS-001",
      "quantity": "1.000",
      "createdAt": "2026-08-05T11:00:00.000Z"
    }
  ]
}
```

### Is kurallari

- Parca eklendiginde stok hareketi `out` tipinde yazilir.
- Hareket notu: `Servis kaydi: {serviceLogId}`
- Coklu parca islemleri tek transaction icinde yapilir.
- Parca silme / stok geri alma bu surumde desteklenmez (audit butunlugu).

### Hata kodlari

| Kod | Durum |
|-----|-------|
| `SERVICE_PART_CREATE_FAILED` | 500 |
| `PRODUCT_NOT_FOUND` | 404 |
| `INSUFFICIENT_STOCK` | 422 |
| `INVALID_STOCK_QUANTITY` | 422 |

### Ilgili dosyalar

- Schema: `src/database/schema/service-parts.ts`
- Service: `src/services/service-log.service.ts`, `src/services/stock.service.ts`
