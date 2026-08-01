# Stok Yonetimi

## Basit Anlatim

Her urunun depoda **ne kadar kaldigi** takip edilir.

- **Giris:** Depoya mal geldi — stok artar.
- **Cikis:** Mal cikti — stok azalir. Yeterli mal yoksa islem reddedilir.
- **Duzeltme:** Sayim yaptin, gercek miktar farkli — stogu dogrudan yeni degere cekersin.
- **Gecmis:** Kim, ne zaman, ne kadar ekledi veya cikardi — hepsi kayit altinda.

Stok, urun duzenleme formundan **degistirilmez**. Her hareket ayri bir islem olarak yapilir; boylece iz kaybi olmaz.

Tum stok islemleri **giris sonrasi** calisir.

---

## Yapilanlar (Teknik)

### Endpoint'ler

| Metod | Yol | Aciklama |
|-------|-----|----------|
| POST | `/products/:id/stock/in` | Stok girisi |
| POST | `/products/:id/stock/out` | Stok cikisi |
| POST | `/products/:id/stock/adjust` | Sayim duzeltmesi |
| GET | `/products/:id/stock/movements` | Hareket gecmisi |

### Giris / cikis body

```json
{
  "quantity": "10",
  "note": "Tedarikci sevkiyati"
}
```

`quantity` string; en fazla 3 ondalik (`"10.500"`).

### Duzeltme body

Stogu **yeni toplam degere** ayarlar (fark kadar hareket uretilir):

```json
{
  "quantity": "25",
  "note": "Aylik sayim"
}
```

### Hareket tipleri

| Tip | Anlam |
|-----|-------|
| `in` | Giris |
| `out` | Cikis |
| `adjustment` | Duzeltme |

### Yanit ornegi

```json
{
  "id": "...",
  "productId": "...",
  "type": "in",
  "quantity": "10",
  "previousStock": "5",
  "newStock": "15",
  "note": "Tedarikci sevkiyati",
  "createdBy": "user-id",
  "createdAt": "..."
}
```

### Is kurallari

- Cikista stok yetersizse **422 INSUFFICIENT_STOCK**
- Urun olusturulurken `initialStock` verilirse otomatik `in` hareketi yazilir
- `products.stockQuantity` her hareket sonrasi guncellenir

### Veritabani (`stock_movements`)

productId, type, quantity, previousStock, newStock, note, createdBy, createdAt

### Ilgili dosyalar

```
src/services/stock.service.ts
src/dtos/stock.dto.ts
src/types/stock.types.ts
src/database/schema/stock-movements.ts
src/routes/product.routes.ts (stok route'lari)
src/controllers/product.controller.ts
```
