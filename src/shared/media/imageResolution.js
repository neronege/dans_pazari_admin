/**
 * @param {number} width
 * @param {number} height
 * @param {number} aspectRatio width/height
 */
export function getMaxCropSize(width, height, aspectRatio) {
  if (!width || !height || !aspectRatio) {
    return { width: 0, height: 0 };
  }

  const cropWidth = Math.min(width, height * aspectRatio);
  const cropHeight = Math.min(height, width / aspectRatio);
  return { width: cropWidth, height: cropHeight };
}

/**
 * @param {{ targetWidth: number, targetHeight: number, label?: string }} spec
 * @param {number} width
 * @param {number} height
 */
export function buildMinResolutionError(spec, width, height) {
  const label = spec.label ? `${spec.label}: ` : '';
  return `${label}Görsel çözünürlüğü yetersiz (${Math.round(width)}×${Math.round(height)}px). Minimum ${spec.targetWidth}×${spec.targetHeight}px gerekli; daha yüksek çözünürlüklü bir görsel seçin.`;
}

/**
 * True when a locked-aspect crop can still yield at least targetWidth×targetHeight.
 */
export function canMeetMinResolution(imageWidth, imageHeight, spec) {
  if (!spec?.targetWidth || !spec?.targetHeight) {
    return true;
  }

  const maxCrop = getMaxCropSize(imageWidth, imageHeight, spec.aspectRatio || spec.targetWidth / spec.targetHeight);
  return maxCrop.width >= spec.targetWidth && maxCrop.height >= spec.targetHeight;
}

export function readImageNaturalSize(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height
      });
    };
    image.onerror = () => reject(new Error('Görsel okunamadı.'));
    image.src = src;
  });
}

export function readFileImageSize(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    readImageNaturalSize(url)
      .then((size) => {
        URL.revokeObjectURL(url);
        resolve(size);
      })
      .catch((error) => {
        URL.revokeObjectURL(url);
        reject(error);
      });
  });
}
