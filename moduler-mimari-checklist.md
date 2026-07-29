# Moduler Mimari Gecis Checklist

Bu checklist, [admin-api-liste.md](admin-api-liste.md) ve [api-conventions.md](api-conventions.md) baz alinip hazirlandi.

## 0. Iskelet (Tamamlandi)

- [x] modules klasoru olusturuldu
- [x] shared klasoru olusturuldu
- [x] widgets klasoru olusturuldu
- [x] dashboard route klasorleri olusturuldu

## 1. Shared API Altyapisi

- [x] [src/shared/api/httpClient.js](src/shared/api/httpClient.js) olustur (base URL, JSON parse, timeout)
- [x] [src/shared/api/authToken.js](src/shared/api/authToken.js) olustur (token get/set/clear)
- [x] [src/shared/api/problemDetails.js](src/shared/api/problemDetails.js) olustur (RFC7807 mapper)
- [x] [src/shared/api/pagination.js](src/shared/api/pagination.js) olustur (page/pageSize helpers)
- [x] [src/shared/api/endpoints.js](src/shared/api/endpoints.js) olustur (tum endpoint sabitleri)
- [x] 401/403/404/409/429 icin ortak hata yonetimini aktif et
- [x] X-Correlation-ID header stratejisini belirle ve uygula

## 2. Auth Modulu

- [x] [src/modules/auth/api](src/modules/auth/api) altinda login/refresh/logout/admin ping service yaz
- [x] role !== Admin oldugunda dashboard erisimini engelle
- [x] token lifecycle (login, refresh, logout) akisini tek yerde yonet
- [x] mevcut auth ekranlarini moduler sayfaya tasi

## 3. Dashboard Modulu

- [x] summary endpoint entegrasyonu yap
- [x] mock datayi kaldir, gercek API ile degistir
- [x] loading/error/empty state bileşenlerini standartlastir

## 4. Katalog Modulleri

- [x] categories modulu: liste, detay, create, update, active, reorder, delete
- [x] venues modulu: liste, detay, create, update, active, delete
- [x] events modulu: CRUD + publish/unpublish/cancel/featured
- [x] events cover upload/delete akislarini ekle
- [x] events sessions ve ticket-types akislarini ekle
- [x] start-bulk-refunds endpointini ekle

## 5. Operasyon Modulleri

- [x] orders modulu: list, detail, fulfill-payment
- [x] tickets modulu: scan API + resultCode durum yonetimi
- [x] refunds modulu: list, detail, approve, reject
- [x] reports modulu: sales, export CSV, performance
- [x] audit-logs modulu: list + detail + filtreleme

## 6. Diger Admin Modulleri

- [x] users modulu entegrasyonu
- [x] blog modulu entegrasyonu
- [x] raffles modulu entegrasyonu

## 7. Route Baglantisi

- [x] [src/app/(dashboard)](src/app/(dashboard)) altindaki yeni route page dosyalarini olustur
- [x] her page dosyasinda sadece ilgili module/pages bileşenini render et
- [x] route-level loading ve error dosyalarini standartlastir

## 8. Navigasyon ve Yetki

- [x] [src/menu-items](src/menu-items) yapisini modullerden beslenen modele gecir
- [x] Admin role bazli menu filtrelerini ekle
- [x] aktif route, breadcrumb ve drawer davranisini test et

## 9. Kod Temizligi

- [ ] tasinan view/section/component dosyalarini kademeli kaldir
- [ ] import alias duzenini kontrol et (baseUrl: src)
- [ ] kopya utility/hook kodlarini shared altinda birlestir

## 10. Kalite ve Dogrulama

- [x] lint temizligi: eslint
- [ ] smoke test: login -> dashboard -> liste ekranlari
- [ ] API hata senaryolari: 401/403/404/409/429
- [ ] pagination ve filtreler icin manuel regresyon testi
- [ ] deploy oncesi env degiskenleri ve base URL kontrolu

## Oncelik Sirasi (Oneri)

- [x] Faz 1: Shared API + Auth + Dashboard
- [x] Faz 2: Categories + Venues
- [x] Faz 3: Events + Orders + Tickets
- [x] Faz 4: Refunds + Reports + Audit Logs
- [x] Faz 5: Users + Blog + Raffles + Temizlik
