/**
 * Venue gallery mock slot: 600x400 (3:2).
 * Aspect is enforced by crop UI; uploads below minimum pixels are rejected.
 */
export const VENUE_IMAGE = {
  label: 'Mekan fotoğrafı',
  targetWidth: 600,
  targetHeight: 400,
  aspectRatio: 1.5,
  aspectMin: 1.5 * 0.95,
  aspectMax: 1.5 * 1.05
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

export function validateVenueImageDimensions(width, height) {
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

  if (width < VENUE_IMAGE.targetWidth || height < VENUE_IMAGE.targetHeight) {
    return {
      ok: false,
      error: `Görsel çözünürlüğü yetersiz (${width}×${height}px). Minimum ${VENUE_IMAGE.targetWidth}×${VENUE_IMAGE.targetHeight}px gerekli; daha yüksek çözünürlüklü bir görsel seçin.`,
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

export async function validateVenueImageFile(file) {
  const { width, height } = await readImageDimensions(file);
  return {
    file,
    ...validateVenueImageDimensions(width, height)
  };
}
