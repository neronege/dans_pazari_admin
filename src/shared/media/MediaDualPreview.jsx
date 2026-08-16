'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { MEDIA_PREVIEW } from 'shared/media/previewFrames';

function PreviewFrame({ src, alt, label, aspectRatio, maxWidth, objectFit, onClick }) {
  return (
    <Stack sx={{ gap: 0.75, flex: '0 0 auto', width: maxWidth, maxWidth: '100%' }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Box
        onClick={onClick}
        sx={{
          width: '100%',
          aspectRatio,
          borderRadius: 1,
          overflow: 'hidden',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: objectFit === 'contain' ? 'grey.100' : 'grey.200',
          cursor: onClick ? 'zoom-in' : 'default',
          boxShadow: 0
        }}
      >
        <Box
          component="img"
          src={src}
          alt={alt}
          sx={{
            width: '100%',
            height: '100%',
            objectFit,
            objectPosition: 'center',
            display: 'block'
          }}
        />
      </Box>
    </Stack>
  );
}

/**
 * Aynı görseli (veya ayrı mobil src) web ve mobil slot oranlarında yan yana gösterir.
 * @param {'eventHero'|'eventBanner'|'eventGallery'|'eventSponsor'|'venue'|'blog'|'poll'} preset
 * @param {string} [mobileSrc] Ayrı mobil görsel; yoksa `src` kullanılır.
 */
export default function MediaDualPreview({
  src,
  mobileSrc,
  alt = 'Önizleme',
  preset = 'eventHero',
  onOpen,
  scale = 1
}) {
  if (!src && !mobileSrc) {
    return null;
  }

  const config = MEDIA_PREVIEW[preset] || MEDIA_PREVIEW.eventHero;
  const objectFit = config.objectFit || 'cover';
  const webMax = Math.round(config.web.maxWidth * scale);
  const mobileMax = Math.round(config.mobile.maxWidth * scale);
  const webSrc = src || mobileSrc;
  const resolvedMobileSrc = mobileSrc || src;

  const handleOpen = (url, label) =>
    onOpen
      ? () => {
          onOpen(url, label);
        }
      : undefined;

  return (
    <Stack sx={{ gap: 1 }}>
      <Typography variant="caption" color="text.secondary">
        Site önizlemesi — web ve mobilde kırpma farkını kontrol edin
        {mobileSrc ? ' (mobil için alternatif görsel)' : ''}
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}
      >
        {webSrc ? (
          <PreviewFrame
            src={webSrc}
            alt={`${alt} — web`}
            label={config.web.label}
            aspectRatio={config.web.aspectRatio}
            maxWidth={webMax}
            objectFit={objectFit}
            onClick={handleOpen(webSrc, `${alt} — web`)}
          />
        ) : null}
        {resolvedMobileSrc ? (
          <PreviewFrame
            src={resolvedMobileSrc}
            alt={`${alt} — mobil`}
            label={config.mobile.label}
            aspectRatio={config.mobile.aspectRatio}
            maxWidth={mobileMax}
            objectFit={objectFit}
            onClick={handleOpen(resolvedMobileSrc, `${alt} — mobil`)}
          />
        ) : null}
      </Stack>
    </Stack>
  );
}
