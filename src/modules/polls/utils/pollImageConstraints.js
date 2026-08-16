/**
 * Anket kartı görseli — web’te başlığın üstünde gösterilir.
 * Önerilen oran ~16:9 (900×506).
 */
export const POLL_IMAGE = {
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

  if (ratio < POLL_IMAGE.aspectMin || ratio > POLL_IMAGE.aspectMax) {
    return {
      ok: false,
      error: `Oran uygun değil (${width}×${height}, oran ${ratio.toFixed(2)}). Beklenen ~16:9 (ör. ${POLL_IMAGE.targetWidth}×${POLL_IMAGE.targetHeight}).`,
      width,
      height,
      ratio
    };
  }

  const lowRes = width < POLL_IMAGE.targetWidth || height < POLL_IMAGE.targetHeight;

  return {
    ok: true,
    warning: lowRes
      ? `Düşük çözünürlük: ${width}×${height}px. Önerilen minimum ${POLL_IMAGE.targetWidth}×${POLL_IMAGE.targetHeight}px.`
      : undefined,
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
