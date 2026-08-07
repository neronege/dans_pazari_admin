/**
 * Venue gallery mock slot: 600x400 (3:2).
 * Minimum is accepted as guidance; higher resolutions are accepted when ratio is compatible.
 */
export const VENUE_IMAGE = {
  targetWidth: 600,
  targetHeight: 400,
  aspectRatio: 1.5,
  /** +/-5% */
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
      reject(new Error('Gorsel okunamadi.'));
    };

    image.src = url;
  });
}

export function validateVenueImageDimensions(width, height) {
  const ratio = height > 0 ? width / height : 0;

  if (!width || !height) {
    return {
      ok: false,
      error: 'Gorsel boyutlari okunamadi.',
      width: 0,
      height: 0,
      ratio: 0
    };
  }

  if (ratio < VENUE_IMAGE.aspectMin || ratio > VENUE_IMAGE.aspectMax) {
    return {
      ok: false,
      error: `Oran uygun degil (${width}x${height}, oran ${ratio.toFixed(2)}). Beklenen ~3:2 (or. ${VENUE_IMAGE.targetWidth}x${VENUE_IMAGE.targetHeight}).`,
      width,
      height,
      ratio
    };
  }

  const lowRes = width < VENUE_IMAGE.targetWidth || height < VENUE_IMAGE.targetHeight;

  return {
    ok: true,
    warning: lowRes
      ? `Dusuk cozunurluk: ${width}x${height}px. Onerilen minimum ${VENUE_IMAGE.targetWidth}x${VENUE_IMAGE.targetHeight}px; webde bulanik gorunebilir.`
      : undefined,
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
