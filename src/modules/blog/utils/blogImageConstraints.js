/**
 * Web blog list/detail Image slot: 900×500 (9:5).
 * Admin uploads must match this aspect ratio.
 */
export const BLOG_IMAGE = {
  targetWidth: 900,
  targetHeight: 500,
  /** 900 / 500 */
  aspectRatio: 1.8,
  /** Allowed ratio drift (±~5%) */
  aspectMin: 1.7,
  aspectMax: 1.9,
  maxCount: 2
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
 * @returns {{ ok: boolean, error?: string, warning?: string, width: number, height: number, ratio: number }}
 */
export function validateBlogImageDimensions(width, height) {
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

  if (ratio < BLOG_IMAGE.aspectMin || ratio > BLOG_IMAGE.aspectMax) {
    return {
      ok: false,
      error: `Oran uygun değil (${width}×${height}, oran ${ratio.toFixed(2)}). Beklenen ~9:5 (ör. ${BLOG_IMAGE.targetWidth}×${BLOG_IMAGE.targetHeight}).`,
      width,
      height,
      ratio
    };
  }

  const lowRes =
    width < BLOG_IMAGE.targetWidth || height < BLOG_IMAGE.targetHeight;

  return {
    ok: true,
    warning: lowRes
      ? `Düşük çözünürlük: ${width}×${height}px. Önerilen minimum ${BLOG_IMAGE.targetWidth}×${BLOG_IMAGE.targetHeight}px; web’de bulanık görünebilir.`
      : undefined,
    width,
    height,
    ratio
  };
}

export async function validateBlogImageFile(file) {
  const { width, height } = await readImageDimensions(file);
  return {
    file,
    ...validateBlogImageDimensions(width, height)
  };
}
