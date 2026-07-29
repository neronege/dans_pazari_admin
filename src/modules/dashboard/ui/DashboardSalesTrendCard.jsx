'use client';

import { useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MainCard from 'components/MainCard';
import { BarChart, axisClasses, barClasses, chartsGridClasses } from '@mui/x-charts';
import { useTheme } from '@mui/material/styles';
import useDashboardSalesReport from 'modules/dashboard/hooks/useDashboardSalesReport';
import { getHumanReadableError } from 'shared/api';

const periodOptions = [
  { value: 'week', label: 'Bu Hafta' },
  { value: 'month', label: 'Bu Ay' },
  { value: 'year', label: 'Bu Yil' }
];

function periodLabel(item, period) {
  const date = new Date(item.periodStartUtc);

  if (period === 'week') {
    return date.toLocaleDateString('tr-TR', { weekday: 'short' });
  }

  if (period === 'year') {
    return date.toLocaleDateString('tr-TR', { month: 'short' });
  }

  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
}

export default function DashboardSalesTrendCard() {
  const theme = useTheme();
  const [period, setPeriod] = useState('week');
  const { sales, isLoading, error, retry } = useDashboardSalesReport(period);

  const chart = useMemo(() => {
    const rows = Array.isArray(sales?.breakdown) ? sales.breakdown : [];

    return {
      labels: rows.map((item) => periodLabel(item, period)),
      values: rows.map((item) => Number(item.salesAmount || 0))
    };
  }, [sales, period]);

  return (
    <Grid size={{ xs: 12, md: 7, lg: 8 }}>
      <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Grid>
          <Typography variant="h5">Satis Raporu</Typography>
        </Grid>
        <Grid>
          <TextField
            size="small"
            select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            slotProps={{ htmlInput: { sx: { py: 0.75, fontSize: '0.875rem' } } }}
          >
            {periodOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      <MainCard sx={{ mt: 1 }} content={false}>
        {error && (
          <Alert
            severity="error"
            sx={{ m: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => retry()}>
                Tekrar Dene
              </Button>
            }
          >
            {getHumanReadableError(error?.problem) || error?.message || 'Satis raporu alinamadi.'}
          </Alert>
        )}

        {!error && isLoading && (
          <Typography sx={{ px: 2, py: 3, color: 'text.secondary' }} variant="body2">
            Yukleniyor...
          </Typography>
        )}

        {!error && !isLoading && chart.values.length === 0 && (
          <Typography sx={{ px: 2, py: 3, color: 'text.secondary' }} variant="body2">
            Gosterilecek satis verisi bulunamadi.
          </Typography>
        )}

        {!error && !isLoading && chart.values.length > 0 && (
          <BarChart
            hideLegend
            height={360}
            grid={{ horizontal: true }}
            xAxis={[
              {
                id: 'sales-trend-axis',
                data: chart.labels,
                tickSize: 7,
                disableLine: true,
                categoryGapRatio: 0.5,
                barGapRatio: 0.4
              }
            ]}
            yAxis={[{ disableLine: true, tickSize: 7 }]}
            series={[{ type: 'bar', data: chart.values, label: 'Satis', color: theme.vars.palette.warning.main }]}
            slotProps={{ bar: { rx: 4, ry: 4 } }}
            axisHighlight={{ x: 'none' }}
            margin={{ top: 30, left: 10, bottom: 25, right: 10 }}
            sx={{
              [`& .${barClasses.element}:hover`]: { opacity: 0.6 },
              [`& .${chartsGridClasses.line}`]: { strokeDasharray: '4 4', stroke: theme.vars.palette.divider },
              [`& .${axisClasses.root}.${axisClasses.directionX} .${axisClasses.tick}`]: { stroke: 'transparent' },
              [`& .${axisClasses.root}.${axisClasses.directionY} .${axisClasses.tick}`]: { stroke: 'transparent' }
            }}
          />
        )}
      </MainCard>
    </Grid>
  );
}
