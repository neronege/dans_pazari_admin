/**
 * Event detail mock thumb: 900×530.
 * Gallery secondary slots on detail: 600×400 (3:2).
 * Sponsor logos (Brand mock wordmarks): exact 200×50.
 */

export const EVENT_COVER_IMAGE = {
  label: 'Kapak',
  targetWidth: 900,
  targetHeight: 530,
  /** 900 / 530 */
  aspectRatio: 900 / 530,
  /** ±5% */
  aspectMin: (900 / 530) * 0.95,
  aspectMax: (900 / 530) * 1.05,
  requireExactPixels: false
};

/** Anasayfa web banner (~900×530). */
export const EVENT_BANNER_IMAGE = {
  label: 'Banner (Web)',
  targetWidth: 900,
  targetHeight: 530,
  aspectRatio: 900 / 530,
  aspectMin: (900 / 530) * 0.95,
  aspectMax: (900 / 530) * 1.05,
  requireExactPixels: false
};

/** Anasayfa mobil banner — web’teki ~72vh telefon çerçevesine yakın dikey oran. */
export const EVENT_MOBILE_BANNER_IMAGE = {
  label: 'Mobil banner',
  targetWidth: 720,
  targetHeight: 1120,
  /** ~9:14 (390×608 @ 72vh phone) */
  aspectRatio: 720 / 1120,
  aspectMin: (720 / 1120) * 0.9,
  aspectMax: (720 / 1120) * 1.1,
  requireExactPixels: false
};

export const EVENT_GALLERY_IMAGE = {
  label: 'Galeri',
  targetWidth: 600,
  targetHeight: 400,
  /** 3:2 */
  aspectRatio: 1.5,
  aspectMin: 1.5 * 0.95,
  aspectMax: 1.5 * 1.05,
  requireExactPixels: false
};

/** Mock brand logo canvas — birebir 200×50 zorunlu. */
export const EVENT_SPONSOR_IMAGE = {
  label: 'Sponsor',
  targetWidth: 200,
  targetHeight: 50,
  aspectRatio: 200 / 50,
  aspectMin: 200 / 50,
  aspectMax: 200 / 50,
  requireExactPixels: true
};

export function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      URL.revokeObjectURL(url);
      resolve({ width, height });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Görsel okunamadı.'));
    };

    image.src = url;
  });
}

/**
 * @param {typeof EVENT_COVER_IMAGE} spec
 * @returns {{ ok: boolean, error?: string, width: number, height: number, ratio: number }}
 */
export function validateEventImageDimensions(width, height, spec) {
  const ratio = height > 0 ? width / height : 0;

  if (!width || !height) {
    return {
      ok: false,
      error: 'Görsel boyutları okunamadı.',
      width: 0,
      height: 0,
      ratio: 0
    };
  }

  if (spec.requireExactPixels) {
    if (width !== spec.targetWidth || height !== spec.targetHeight) {
      return {
        ok: false,
        error: `Sponsor logosu tam ${spec.targetWidth}×${spec.targetHeight}px olmalıdır (seçilen: ${width}×${height}px).`,
        width,
        height,
        ratio
      };
    }

    return {
      ok: true,
      width,
      height,
      ratio
    };
  }

  // Oran kırpma ile sabitlenir; kabul/red yalnızca minimum çözünürlüğe bakılır.
  if (width < spec.targetWidth || height < spec.targetHeight) {
    return {
      ok: false,
      error: `Görsel çözünürlüğü yetersiz (${width}×${height}px). Minimum ${spec.targetWidth}×${spec.targetHeight}px gerekli; daha yüksek çözünürlüklü bir görsel seçin.`,
      width,
      height,
      ratio
    };
  }

  return {
    ok: true,
    width,
    height,
    ratio
  };
}

export async function validateEventImageFile(file, spec) {
  const { width, height } = await readImageDimensions(file);
  return {
    file,
    ...validateEventImageDimensions(width, height, spec)
  };
}
