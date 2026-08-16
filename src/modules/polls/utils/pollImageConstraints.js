/**
 * Anket kartı görseli — web’te başlığın üstünde gösterilir.
 * Önerilen oran ~16:9 (900×506).
 */
export const POLL_IMAGE = {
  label: 'Anket görseli',
  targetWidth: 900,
  targetHeight: 506,
  aspectRatio: 900 / 506,
  aspectMin: (900 / 506) * 0.9,
  aspectMax: (900 / 506) * 1.1
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

export function validatePollImageDimensions(width, height) {
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
  if (width < POLL_IMAGE.targetWidth || height < POLL_IMAGE.targetHeight) {
    return {
      ok: false,
      error: `Görsel çözünürlüğü yetersiz (${width}×${height}px). Minimum ${POLL_IMAGE.targetWidth}×${POLL_IMAGE.targetHeight}px gerekli; daha yüksek çözünürlüklü bir görsel seçin.`,
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

export async function validatePollImageFile(file) {
  const { width, height } = await readImageDimensions(file);
  return {
    file,
    ...validatePollImageDimensions(width, height)
  };
}
