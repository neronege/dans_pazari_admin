'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import MainCard from 'components/MainCard';
import useDashboardPerformanceReport from 'modules/dashboard/hooks/useDashboardPerformanceReport';
import { getHumanReadableError } from 'shared/api';

function formatCurrency(value) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

export default function DashboardPerformanceCard() {
  const { performanceRows, isLoading, error, retry } = useDashboardPerformanceReport();

  const topRows = [...performanceRows].sort((a, b) => Number(b.grossSalesAmount || 0) - Number(a.grossSalesAmount || 0)).slice(0, 3);

  return (
    <Grid size={{ xs: 12, md: 5, lg: 4 }}>
      <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Grid>
          <Typography variant="h5">Performans Raporu</Typography>
        </Grid>
      </Grid>
      <MainCard sx={{ mt: 2 }} content={false}>
        {error && (
          <Alert
            severity="error"
            sx={{ mx: 2, my: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => retry()}>
                Tekrar Dene
              </Button>
            }
          >
            {getHumanReadableError(error?.problem) || error?.message || 'Performans raporu alinamadi.'}
          </Alert>
        )}

        {!error && isLoading && (
          <Typography sx={{ px: 2, py: 3, color: 'text.secondary' }} variant="body2">
            Yukleniyor...
          </Typography>
        )}

        {!error && !isLoading && topRows.length === 0 && (
          <Typography sx={{ px: 2, py: 3, color: 'text.secondary' }} variant="body2">
            Gosterilecek performans verisi bulunamadi.
          </Typography>
        )}

        {!error && !isLoading && topRows.length > 0 && (
          <List sx={{ p: 0, '& .MuiListItemButton-root': { py: 2 } }}>
            {topRows.map((row, index) => (
              <ListItemButton key={`${row.eventId || 'event'}-${index}`} divider={index < topRows.length - 1}>
                <ListItemText primary={row.eventTitle || `Etkinlik ${index + 1}`} secondary={`${row.ticketsSold || 0} bilet satildi`} />
                <Typography variant="h6">{formatCurrency(row.grossSalesAmount)}</Typography>
              </ListItemButton>
            ))}
          </List>
        )}
      </MainCard>
    </Grid>
  );
}
