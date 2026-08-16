'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

export default function MediaLightbox({ open, url, title, onClose }) {
  return (
    <Dialog open={Boolean(open)} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title || 'Görsel Önizleme'}</DialogTitle>
      <DialogContent>
        {url ? (
          <Box
            component="img"
            src={url}
            alt={title || 'Görsel Önizleme'}
            sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 1 }}
          />
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Kapat</Button>
      </DialogActions>
    </Dialog>
  );
}
