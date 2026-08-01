# Lift Dokumantasyonu

Bu klasorde her modul ayri bir dosyada anlatilir. Her dosyanin basinda sade dilde ozet, devaminda teknik detaylar vardir.

## Moduller

| Dosya | Konu |
|-------|------|
| [AUTH.md](./AUTH.md) | Kayit, giris, cikis, oturum |
| [CATEGORIES.md](./CATEGORIES.md) | Urun kategorileri |
| [PRODUCTS.md](./PRODUCTS.md) | Urun katalogu ve fotograflar |
| [STOCK.md](./STOCK.md) | Stok giris, cikis, duzeltme, gecmis |
| [STORAGE.md](./STORAGE.md) | MinIO ile fotograf depolama |
| [NGINX.md](./NGINX.md) | Mobil / ekip testi icin nginx |

## Genel kural

Uygulamada **kategori, urun, stok ve fotograf** islemlerinin hepsi **giris yapildiktan sonra** calisir. Sadece kayit, giris, token yenileme, cikis ve saglik kontrolu (`/health`) herkese aciktir.
