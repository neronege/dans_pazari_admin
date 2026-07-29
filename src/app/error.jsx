'use client';

import { useEffect } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MainCard from 'components/MainCard';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <MainCard>
      <Stack sx={{ gap: 2 }}>
        <Typography variant="h4">Bir hata olustu</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Beklenmeyen bir durumla karsilasildi. Sayfayi yeniden deneyebilirsiniz.
        </Typography>
        <Stack direction="row" sx={{ gap: 1 }}>
          <Button variant="contained" onClick={() => reset()}>
            Tekrar Dene
          </Button>
        </Stack>
      </Stack>
    </MainCard>
  );
}
