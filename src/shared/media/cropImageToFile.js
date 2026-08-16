/**
 * Crops an image using pixel area from react-easy-crop and returns a File.
 */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('Görsel yüklenemedi.')));
    image.crossOrigin = 'anonymous';
    image.src = src;
  });
}

/**
 * @param {string} imageSrc
 * @param {{ x: number, y: number, width: number, height: number }} pixelCrop
 * @param {{
 *   fileName?: string,
 *   mimeType?: string,
 *   quality?: number,
 *   outputWidth?: number,
 *   outputHeight?: number
 * }} [options]
 * @returns {Promise<File>}
 */
export async function cropImageToFile(imageSrc, pixelCrop, options = {}) {
  const image = await loadImage(imageSrc);
  const mimeType = options.mimeType || 'image/jpeg';
  const quality = options.quality ?? 0.92;
  const fileName = options.fileName || `crop-${Date.now()}.jpg`;

  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = Math.max(1, Math.round(pixelCrop.width));
  sourceCanvas.height = Math.max(1, Math.round(pixelCrop.height));
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) {
    throw new Error('Canvas desteklenmiyor.');
  }

  sourceCtx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height
  );

  let exportCanvas = sourceCanvas;
  if (options.outputWidth && options.outputHeight) {
    exportCanvas = document.createElement('canvas');
    exportCanvas.width = options.outputWidth;
    exportCanvas.height = options.outputHeight;
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) {
      throw new Error('Canvas desteklenmiyor.');
    }
    exportCtx.drawImage(sourceCanvas, 0, 0, options.outputWidth, options.outputHeight);
  }

  const blob = await new Promise((resolve, reject) => {
    exportCanvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('Kırpılmış görsel oluşturulamadı.'));
          return;
        }
        resolve(result);
      },
      mimeType,
      quality
    );
  });

  const safeName = fileName.replace(/\.[^.]+$/, mimeType === 'image/png' ? '.png' : '.jpg');
  return new File([blob], safeName, { type: mimeType, lastModified: Date.now() });
}
