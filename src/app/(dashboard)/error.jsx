'use client';

import { useEffect } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MainCard from 'components/MainCard';

export default function DashboardError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <MainCard>
      <Stack sx={{ gap: 2 }}>
        <Typography variant="h4">Panel hatasi</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Panel icerigi yuklenirken bir hata olustu.
        </Typography>
        <Button variant="contained" onClick={() => reset()}>
          Yeniden Yukle
        </Button>
      </Stack>
    </MainCard>
  );
}
