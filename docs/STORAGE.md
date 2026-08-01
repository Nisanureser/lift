# Fotograf Depolama (MinIO)

## Basit Anlatim

Urun fotograflari artik bilgisayarin klasorune degil, **MinIO** adli bir depoya kaydediliyor. MinIO, fotograflari guvenli ve duzenli tutan bir "dosya dolabi" gibi dusunulebilir.

- Fotograf yuklediginde once depoya gider, sonra veritabanina kaydi yazilir.
- Fotograf gosterilirken uygulama depodan okuyup sana iletir.
- Fotograf sildiginde hem depodan hem veritabanindan silinir.
- Depoya sadece **giris yapmis kullanicilar** erisebilir; linki bilen biri giris yapmadan goremez.

Gelistirme ortaminda MinIO **Docker** ile calisir. Bilgisayari her actiginda once MinIO'yu, sonra API'yi baslatman gerekir.

---

## Yapilanlar (Teknik)

### Mimari

```
Client → POST /products (multipart images)
           ↓
       product.service → storage.service → MinIO bucket
           ↓
       PostgreSQL (product_images.filePath = S3 key)

Client → GET /uploads/products/... (auth gerekli)
           ↓
       index.ts proxy → storage.service → MinIO
```

### Docker

```bash
docker compose up -d
```

| Servis | Port | Aciklama |
|--------|------|----------|
| minio | 9000 | S3 API |
| minio | 9001 | Web console |
| minio-init | — | `lift-uploads` bucket olusturur |

Console: http://localhost:9001  
Varsayilan giris: `minioadmin` / `minioadmin`

### Bucket ve object key

- Bucket: `lift-uploads`
- Key formati: `products/{productId}/{timestamp-uuid}.jpg`

Ornek key: `products/clxyz123/1733123456-a1b2c3d4.jpg`

### Ortam degiskenleri

```
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=lift-uploads
S3_REGION=us-east-1
PUBLIC_BASE_URL=http://localhost:3000
```

API Docker icinde calisiyorsa endpoint: `http://minio:9000`

### Baslangic

API acilirken `ensureStorageBucket()` MinIO'ya baglanir; hazir degilse bekler (max ~30 sn). MinIO kapaliysa acik hata mesaji verir.

### Ilgili dosyalar

```
docker-compose.yml
src/services/storage.service.ts
src/utils/file.util.ts
src/index.ts                    # GET /uploads/* proxy
src/services/product.service.ts # upload / delete
```

### Eski disk depolama

Onceki surumde fotograflar `uploads/` klasorundaydi. MinIO gecisi sonrasi bu klasor kullanilmiyor. Eski fotolar varsa yeniden yuklenmeli veya manuel migrate edilmeli.
