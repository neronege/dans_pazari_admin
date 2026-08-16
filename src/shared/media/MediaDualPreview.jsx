'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { MEDIA_PREVIEW } from 'shared/media/previewFrames';

function PreviewFrame({ src, alt, label, aspectRatio, maxWidth, objectFit, onClick }) {
  return (
    <Stack sx={{ gap: 0.75, flex: '0 1 auto', minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Box
        onClick={onClick}
        sx={{
          width: '100%',
          maxWidth,
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
 * Aynı görseli web ve mobil slot oranlarında yan yana gösterir.
 * @param {'eventHero'|'eventGallery'|'eventSponsor'|'venue'|'blog'|'poll'} preset
 */
export default function MediaDualPreview({
  src,
  alt = 'Önizleme',
  preset = 'eventHero',
  onOpen,
  scale = 1
}) {
  if (!src) {
    return null;
  }

  const config = MEDIA_PREVIEW[preset] || MEDIA_PREVIEW.eventHero;
  const objectFit = config.objectFit || 'cover';
  const webMax = Math.round(config.web.maxWidth * scale);
  const mobileMax = Math.round(config.mobile.maxWidth * scale);

  const handleOpen = onOpen
    ? () => {
        onOpen(src, alt);
      }
    : undefined;

  return (
    <Stack sx={{ gap: 1 }}>
      <Typography variant="caption" color="text.secondary">
        Site önizlemesi — web ve mobilde kırpma farkını kontrol edin
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}
      >
        <PreviewFrame
          src={src}
          alt={`${alt} — web`}
          label={config.web.label}
          aspectRatio={config.web.aspectRatio}
          maxWidth={webMax}
          objectFit={objectFit}
          onClick={handleOpen}
        />
        <PreviewFrame
          src={src}
          alt={`${alt} — mobil`}
          label={config.mobile.label}
          aspectRatio={config.mobile.aspectRatio}
          maxWidth={mobileMax}
          objectFit={objectFit}
          onClick={handleOpen}
        />
      </Stack>
    </Stack>
  );
}
