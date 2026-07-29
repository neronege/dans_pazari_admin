'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MainCard from 'components/MainCard';
import { BarChart, axisClasses, barClasses } from '@mui/x-charts';
import { useTheme } from '@mui/material/styles';
import useDashboardSalesReport from 'modules/dashboard/hooks/useDashboardSalesReport';

function formatCurrency(value, currencyCode) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currencyCode || 'TRY',
    maximumFractionDigits: 2
  }).format(value || 0);
}

export default function DashboardIncomeOverviewCard() {
  const theme = useTheme();
  const { sales, isLoading, error, retry } = useDashboardSalesReport('week');

  const breakdown = Array.isArray(sales?.breakdown) ? sales.breakdown : [];
  const labels = breakdown.map((item) => new Date(item.periodStartUtc).toLocaleDateString('tr-TR', { weekday: 'short' }));
  const values = breakdown.map((item) => Number(item.salesAmount || 0));

  return (
    <Grid size={{ xs: 12, md: 5, lg: 4 }}>
      <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Grid>
          <Typography variant="h5">Gelir Ozeti</Typography>
        </Grid>
      </Grid>
      <MainCard sx={{ mt: 2 }} content={false}>
        <Box sx={{ p: 3, pb: 0 }}>
          <Stack sx={{ gap: 2 }}>
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              Son 7 Gun Satis
            </Typography>
            <Typography variant="h3">{formatCurrency(sales?.totalSalesAmount || 0, sales?.currency || 'TRY')}</Typography>
          </Stack>
        </Box>

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
            Gelir verisi alinamadi.
          </Alert>
        )}

        {!error && isLoading && (
          <Box sx={{ px: 3, py: 4 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Yukleniyor...
            </Typography>
          </Box>
        )}

        {!error && !isLoading && values.length > 0 && (
          <BarChart
            hideLegend
            height={280}
            series={[{ data: values, label: 'Satis' }]}
            xAxis={[{ data: labels, scaleType: 'band', tickSize: 7, disableLine: true }]}
            yAxis={[{ position: 'none' }]}
            slotProps={{ bar: { rx: 5, ry: 5 } }}
            axisHighlight={{ x: 'none' }}
            margin={{ left: 20, right: 20 }}
            colors={[theme.vars.palette.info.light]}
            sx={{
              [`& .${barClasses.element}:hover`]: { opacity: 0.6 },
              [`& .${axisClasses.root}.${axisClasses.directionX} .${axisClasses.tick}`]: { stroke: 'transparent' }
            }}
          />
        )}
      </MainCard>
    </Grid>
  );
}
