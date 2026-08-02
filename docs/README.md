# Lift Dokumantasyonu

Bu klasorde her modul ayri bir dosyada anlatilir. Her dosyanin basinda sade dilde ozet, devaminda teknik detaylar vardir.

## Moduller

| Dosya | Konu |
|-------|------|
| [AUTH.md](./AUTH.md) | Kayit, giris, cikis, oturum |
| [CATEGORIES.md](./CATEGORIES.md) | Urun kategorileri |
| [CUSTOMERS.md](./CUSTOMERS.md) | Bireysel ve kurumsal musteriler |
| [SITES.md](./SITES.md) | Musteri tesis / bina kayitlari |
| [ELEVATORS.md](./ELEVATORS.md) | Tesis asansor / cihaz kayitlari |
| [ROADMAP.md](./ROADMAP.md) | Asansor firmasi — sonraki moduller yol haritasi |
| [PRODUCTS.md](./PRODUCTS.md) | Urun katalogu ve fotograflar |
| [STOCK.md](./STOCK.md) | Stok giris, cikis, duzeltme, gecmis |
| [WORK_ORDERS.md](./WORK_ORDERS.md) | Saha is emri planlama |
| [SERVICE_LOGS.md](./SERVICE_LOGS.md) | Teknisyen servis kayitlari |
| [SERVICE_PARTS.md](./SERVICE_PARTS.md) | Servis parca tuketimi |
| [CONTRACTS.md](./CONTRACTS.md) | Bakim / hizmet sozlesmeleri |
| [STORAGE.md](./STORAGE.md) | MinIO ile fotograf depolama |
| [NGINX.md](./NGINX.md) | Mobil / ekip testi icin nginx |

## Genel kural

Uygulamada **kategori, musteri, tesis, asansor, urun, stok, is emri, servis kaydi, sozlesme ve fotograf** islemlerinin hepsi **giris yapildiktan sonra** calisir. Tum silme islemleri soft delete'tir. Sadece kayit, giris, token yenileme, cikis ve saglik kontrolu (`/health`) herkese aciktir.
