/**
 * Web sitesindeki gerçek CSS slot oranları — admin önizlemesi bunlara göre kesilir.
 * Tek dosya yüklenir; web/mobil farkı object-fit: cover kırpmasıyla oluşur.
 */

export const MEDIA_PREVIEW = {
  /** Etkinlik kapak + banner: detay 900×530, liste 3:2 */
  eventHero: {
    web: { label: 'Web · Detay', aspectRatio: '900 / 530', maxWidth: 360 },
    mobile: { label: 'Mobil · Liste', aspectRatio: '3 / 2', maxWidth: 168 },
    objectFit: 'cover'
  },
  /** Galeri: her yerde 3:2; genişlik farkı responsive kırpmayı gösterir */
  eventGallery: {
    web: { label: 'Web · Galeri', aspectRatio: '3 / 2', maxWidth: 280 },
    mobile: { label: 'Mobil · Galeri', aspectRatio: '3 / 2', maxWidth: 160 },
    objectFit: 'cover'
  },
  eventSponsor: {
    web: { label: 'Web · Sponsor', aspectRatio: '4 / 1', maxWidth: 200 },
    mobile: { label: 'Mobil · Sponsor', aspectRatio: '4 / 1', maxWidth: 140 },
    objectFit: 'contain'
  },
  venue: {
    web: { label: 'Web · Mekan', aspectRatio: '3 / 2', maxWidth: 320 },
    mobile: { label: 'Mobil · Mekan', aspectRatio: '3 / 2', maxWidth: 160 },
    objectFit: 'cover'
  },
  blog: {
    web: { label: 'Web · Liste/Detay', aspectRatio: '9 / 5', maxWidth: 360 },
    mobile: { label: 'Mobil · Kart', aspectRatio: '10 / 7', maxWidth: 168 },
    objectFit: 'cover'
  },
  poll: {
    web: { label: 'Web · Anket', aspectRatio: '16 / 9', maxWidth: 360 },
    mobile: { label: 'Mobil · Anket', aspectRatio: '16 / 9', maxWidth: 180 },
    objectFit: 'cover'
  }
};
