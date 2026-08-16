'use client';

import 'react-easy-crop/react-easy-crop.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Cropper from 'react-easy-crop';
import { cropImageToFile } from 'shared/media/cropImageToFile';

/**
 * Instagram-style crop dialog with locked aspect ratio.
 *
 * @param {{
 *   open: boolean,
 *   imageSrc: string | null,
 *   aspect: number,
 *   title?: string,
 *   helperText?: string,
 *   fileName?: string,
 *   outputWidth?: number,
 *   outputHeight?: number,
 *   requireExactPixels?: boolean,
 *   onCancel: () => void,
 *   onComplete: (file: File) => void | Promise<void>
 * }} props
 */
export default function ImageCropDialog({
  open,
  imageSrc,
  aspect,
  title = 'Görseli kırp',
  helperText,
  fileName,
  outputWidth,
  outputHeight,
  minWidth,
  minHeight,
  requireExactPixels = false,
  onCancel,
  onComplete
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setBusy(false);
    setError('');
  }, [open, imageSrc]);

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const aspectLabel = useMemo(() => {
    if (outputWidth && outputHeight) {
      return `${outputWidth}×${outputHeight}`;
    }
    return aspect ? aspect.toFixed(2) : '';
  }, [aspect, outputHeight, outputWidth]);

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      return;
    }

    const cropW = Math.round(croppedAreaPixels.width);
    const cropH = Math.round(croppedAreaPixels.height);
    if ((minWidth && cropW < minWidth) || (minHeight && cropH < minHeight)) {
      setError(
        `Seçilen alan çok küçük (${cropW}×${cropH}px). Minimum ${minWidth}×${minHeight}px gerekli; zoom’u azaltın veya daha büyük görsel yükleyin.`
      );
      return;
    }

    try {
      setBusy(true);
      setError('');
      const file = await cropImageToFile(imageSrc, croppedAreaPixels, {
        fileName: fileName || 'cropped.jpg',
        mimeType: 'image/jpeg',
        quality: 0.92,
        outputWidth: requireExactPixels ? outputWidth : undefined,
        outputHeight: requireExactPixels ? outputHeight : undefined
      });
      await onComplete(file);
    } catch (cropError) {
      setError(cropError?.message || 'Kırpma tamamlanamadı.');
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onCancel} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {helperText ||
              `Kırpma oranı sabit (${aspectLabel}). Çerçeveyi sürükleyip zoom ile kadrajı seçin.`}
          </Typography>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: 360,
              bgcolor: '#111',
              borderRadius: 1,
              overflow: 'hidden'
            }}
          >
            {imageSrc ? (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                showGrid
              />
            ) : null}
          </Box>
          <Box px={1}>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              Yakınlaştır
            </Typography>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              onChange={(_event, value) => setZoom(value)}
              disabled={busy}
              aria-label="Yakınlaştır"
            />
          </Box>
          {error ? (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={busy}>
          Vazgeç
        </Button>
        <Button variant="contained" onClick={handleApply} disabled={busy || !croppedAreaPixels}>
          {busy ? 'Kaydediliyor…' : 'Kırp ve kullan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
