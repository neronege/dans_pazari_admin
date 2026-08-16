'use client';

import { useCallback, useRef, useState } from 'react';
import ImageCropDialog from 'shared/media/ImageCropDialog';
import {
  buildMinResolutionError,
  canMeetMinResolution,
  readFileImageSize
} from 'shared/media/imageResolution';

/**
 * Promise-based crop queue for one or many image files.
 * Spec shape: { label, aspectRatio, targetWidth, targetHeight, requireExactPixels? }
 */
export default function useImageCrop() {
  const [session, setSession] = useState(null);
  const sessionRef = useRef(null);
  const resolverRef = useRef(null);

  const closeSession = useCallback((result) => {
    const current = sessionRef.current;
    if (current?.objectUrl) {
      URL.revokeObjectURL(current.objectUrl);
    }
    sessionRef.current = null;
    setSession(null);
    const resolve = resolverRef.current;
    resolverRef.current = null;
    resolve?.(result);
  }, []);

  const cropFile = useCallback(async (file, spec) => {
    if (!file || !spec?.aspectRatio) {
      return null;
    }

    const size = await readFileImageSize(file);
    if (!canMeetMinResolution(size.width, size.height, spec)) {
      throw new Error(buildMinResolutionError(spec, size.width, size.height));
    }

    return new Promise((resolve) => {
      if (resolverRef.current) {
        resolverRef.current(null);
      }
      if (sessionRef.current?.objectUrl) {
        URL.revokeObjectURL(sessionRef.current.objectUrl);
      }

      resolverRef.current = resolve;
      const next = {
        objectUrl: URL.createObjectURL(file),
        fileName: file.name,
        spec
      };
      sessionRef.current = next;
      setSession(next);
    });
  }, []);

  const cropFiles = useCallback(
    async (files, spec) => {
      const list = Array.from(files || []);
      const cropped = [];
      const errors = [];

      for (const file of list) {
        try {
          const result = await cropFile(file, spec);
          if (result) {
            cropped.push(result);
          }
        } catch (error) {
          errors.push(error?.message || `${file.name}: Görsel işlenemedi.`);
        }
      }

      if (!cropped.length && errors.length) {
        throw new Error(errors.join(' '));
      }

      return { files: cropped, errors };
    },
    [cropFile]
  );

  const dialog = (
    <ImageCropDialog
      open={Boolean(session)}
      imageSrc={session?.objectUrl || null}
      aspect={session?.spec?.aspectRatio || 1}
      title={`${session?.spec?.label || 'Görsel'} kırp`}
      helperText={
        session?.spec
          ? `Kırpma oranı sabit (${session.spec.targetWidth}×${session.spec.targetHeight}). Çerçeveyi sürükleyip zoom ile kadrajı seçin. Çözünürlük bu minimumun altındaysa kabul edilmez.`
          : undefined
      }
      fileName={session?.fileName}
      outputWidth={session?.spec?.targetWidth}
      outputHeight={session?.spec?.targetHeight}
      minWidth={session?.spec?.targetWidth}
      minHeight={session?.spec?.targetHeight}
      requireExactPixels={Boolean(session?.spec?.requireExactPixels)}
      onCancel={() => closeSession(null)}
      onComplete={(file) => closeSession(file)}
    />
  );

  return { cropFile, cropFiles, dialog };
}
