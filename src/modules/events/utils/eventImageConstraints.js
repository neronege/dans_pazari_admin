/**
 * Event detail mock thumb: 900×530.
 * Gallery secondary slots on detail: 600×400 (3:2).
 */

export const EVENT_COVER_IMAGE = {
  label: 'Kapak / Banner',
  targetWidth: 900,
  targetHeight: 530,
  /** 900 / 530 */
  aspectRatio: 900 / 530,
  /** ±5% */
  aspectMin: (900 / 530) * 0.95,
  aspectMax: (900 / 530) * 1.05
};

export const EVENT_GALLERY_IMAGE = {
  label: 'Galeri',
  targetWidth: 600,
  targetHeight: 400,
  /** 3:2 */
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

/**
 * @param {typeof EVENT_COVER_IMAGE} spec
 * @returns {{ ok: boolean, error?: string, warning?: string, width: number, height: number, ratio: number }}
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

  if (ratio < spec.aspectMin || ratio > spec.aspectMax) {
    return {
      ok: false,
      error: `Oran uygun değil (${width}×${height}, oran ${ratio.toFixed(2)}). Beklenen ~${spec.targetWidth}×${spec.targetHeight}px.`,
      width,
      height,
      ratio
    };
  }

  const lowRes = width < spec.targetWidth || height < spec.targetHeight;

  return {
    ok: true,
    warning: lowRes
      ? `Düşük çözünürlük: ${width}×${height}px. Önerilen minimum ${spec.targetWidth}×${spec.targetHeight}px; web’de bulanık görünebilir.`
      : undefined,
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
