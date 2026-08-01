# Urunler ve Fotograflar

## Basit Anlatim

Bu bolum **malzeme katalogunu** tutar: her urunun kodu, adi, aciklamasi, fiyati, birimi, stogu ve fotograflari.

- Giris yaptiktan sonra urunleri **listeleyebilir**, **detayina bakabilir**, **yeni urun ekleyebilir**, **duzenleyebilir** ve **silebilirsin**.
- Her urunun benzersiz bir **kodu (SKU)** vardir; ayni kod iki kez kullanilamaz.
- Urun bir **kategoriye** baglidir.
- **Fotograf** yukleyebilirsin: olustururken veya duzenlerken, tek seferde birden fazla foto gidebilir (en fazla 20).
- Ilk yuklenen foto otomatik **kapak fotosu** olur.
- Duzenlerken eski fotolari **silebilir**, yenilerini **ekleyebilirsin**; hepsi ayni istekte yapilir.
- Stok miktari urun duzenleme ekranindan degil; ayri **stok islemleri** ile yonetilir (bkz. [STOCK.md](./STOCK.md)).

Fotograflar bilgisayar diskinde degil, **MinIO** deposunda saklanir. Uygulama uzerinden goruntulenir (bkz. [STORAGE.md](./STORAGE.md)).

---

## Yapilanlar (Teknik)

### Endpoint'ler

Tum endpoint'ler `authGuard` arkasinda.

| Metod | Yol | Aciklama |
|-------|-----|----------|
| GET | `/products` | Sayfali liste |
| GET | `/products/:id` | Detay + tum fotograflar |
| POST | `/products` | Olustur (+ opsiyonel fotolar) |
| PATCH | `/products/:id` | Guncelle (+ foto ekle/sil) |
| DELETE | `/products/:id` | Sil (fotolar da silinir) |

Stok endpoint'leri icin [STOCK.md](./STOCK.md).

### Urun alanlari

| Alan | Kural |
|------|-------|
| sku | Benzersiz, zorunlu |
| name | Min 2 karakter |
| description | Min 3 karakter |
| price | `"1500.00"` formatinda string |
| unit | `piece`, `liter`, `kilogram`, `meter`, `box`, `pack` |
| categoryId | Aktif kategori |
| initialStock | Sadece olusturmada; opsiyonel baslangic stogu |
| isActive | Varsayilan `true` |

### Fotograf kurallari

| Kural | Deger |
|-------|-------|
| Format | jpeg, png, webp |
| Max boyut | 5 MB / foto |
| Max adet | 20 / urun |
| Yukleme | `images` alani (multipart) |
| Silme | `removeImageIds` (PATCH) |

Ayri foto endpoint'i **yok**; create/update icinde halledilir.

### Olusturma — JSON (fotosuz)

```json
{
  "sku": "MOTOR-001",
  "name": "Asansor Motoru",
  "description": "3 fazli motor",
  "price": "1500.00",
  "unit": "piece",
  "categoryId": "kategori-id",
  "initialStock": "10"
}
```

### Olusturma — multipart (fotolu)

```
Content-Type: multipart/form-data

sku, name, description, price, unit, categoryId
initialStock (opsiyonel)
images → dosya veya dosyalar
```

### Guncelleme — foto silme

```json
{
  "name": "Yeni ad",
  "removeImageIds": ["foto-id-1"]
}
```

Multipart'ta:

```ts
formData.append('removeImageIds', JSON.stringify(['id1', 'id2']))
```

### Liste query

```
GET /products?page=1&limit=20&categoryId=...&search=motor&isActive=true
```

Liste yanitinda `primaryImage`; detay yanitinda `images[]` (url, isPrimary, sortOrder).

### Fotograf URL'i

```
{PUBLIC_BASE_URL}/uploads/products/{urunId}/{dosya}.jpg
```

Ornek: `http://localhost:3000/uploads/products/clxyz/1733-abc.jpg`

Proxy uzerinden MinIO'dan okunur; **giris gerekir**.

### Veritabani

**`products`** — sku, name, description, price, unit, stockQuantity, categoryId, isActive, createdBy

**`product_images`** — productId, fileName, filePath (S3 key), mimeType, isPrimary, sortOrder

### Ilgili dosyalar

```
src/routes/product.routes.ts
src/controllers/product.controller.ts
src/services/product.service.ts
src/dtos/product.dto.ts
src/utils/product-form.util.ts
src/utils/file.util.ts
src/services/storage.service.ts
src/database/schema/products.ts
src/database/schema/product-images.ts
src/constants/product.constants.ts
```
