/**
 * Web sitesindeki gerçek CSS slot oranları — admin önizlemesi bunlara göre kesilir.
 */

export const MEDIA_PREVIEW = {
  /** Etkinlik kapak: detay 900×530, liste 3:2 */
  eventHero: {
    web: { label: 'Web · Detay', aspectRatio: '900 / 530', maxWidth: 360 },
    mobile: { label: 'Mobil · Liste', aspectRatio: '3 / 2', maxWidth: 168 },
    objectFit: 'cover'
  },
  /**
   * Anasayfa banner — web’teki gerçek hero çerçevesi:
   * desktop ~72vh yatay, mobil telefon ~72vh dikey (≈9/14).
   */
  eventBanner: {
    web: { label: 'Web · Anasayfa', aspectRatio: '20 / 9', maxWidth: 360 },
    mobile: { label: 'Mobil · Anasayfa', aspectRatio: '9 / 14', maxWidth: 168 },
    objectFit: 'cover'
  },
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
