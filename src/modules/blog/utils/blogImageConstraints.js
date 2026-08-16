/**
 * Web blog list/detail Image slot: 900×500 (9:5).
 * Admin uploads must match this aspect ratio.
 */
export const BLOG_IMAGE = {
  label: 'Blog görseli',
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
 * @returns {{ ok: boolean, error?: string, width: number, height: number, ratio: number }}
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

  // Oran kırpma ile sabitlenir; kabul/red yalnızca minimum çözünürlüğe bakılır.
  if (width < BLOG_IMAGE.targetWidth || height < BLOG_IMAGE.targetHeight) {
    return {
      ok: false,
      error: `Görsel çözünürlüğü yetersiz (${width}×${height}px). Minimum ${BLOG_IMAGE.targetWidth}×${BLOG_IMAGE.targetHeight}px gerekli; daha yüksek çözünürlüklü bir görsel seçin.`,
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

export async function validateBlogImageFile(file) {
  const { width, height } = await readImageDimensions(file);
  return {
    file,
    ...validateBlogImageDimensions(width, height)
  };
}
