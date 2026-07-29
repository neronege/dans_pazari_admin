'use client';

import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import useDashboardSummary from 'modules/dashboard/hooks/useDashboardSummary';
import { getHumanReadableError } from 'shared/api';

function formatInteger(value) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value || 0);
}

function formatCurrency(value, currencyCode) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currencyCode || 'TRY',
    maximumFractionDigits: 2
  }).format(value || 0);
}

export default function DashboardSummaryCards() {
  const { summary, isLoading, error, retry } = useDashboardSummary();

  if (isLoading) {
    return (
      <>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <AnalyticEcommerce title="Toplam Satis" count="..." extra="Yukleniyor" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <AnalyticEcommerce title="Odenen Siparis" count="..." extra="Yukleniyor" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <AnalyticEcommerce title="Aktif Etkinlik" count="..." extra="Yukleniyor" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <AnalyticEcommerce title="Bekleyen Iade" count="..." extra="Yukleniyor" />
        </Grid>
      </>
    );
  }

  if (error) {
    return (
      <Grid size={12}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => retry()}>
              Tekrar Dene
            </Button>
          }
        >
          {getHumanReadableError(error?.problem) || 'Panel ozeti alinamadi.'}
        </Alert>
      </Grid>
    );
  }

  if (!summary) {
    return (
      <Grid size={12}>
        <Alert severity="warning">Panel ozeti bos dondu.</Alert>
      </Grid>
    );
  }

  const generatedAtText = summary.generatedAtUtc ? new Date(summary.generatedAtUtc).toLocaleString('tr-TR') : 'Bilinmiyor';

  return (
    <>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce
          title="Toplam Satis"
          count={formatCurrency(summary.totalSalesAmount, summary.currency)}
          extra={`Guncellenme: ${generatedAtText}`}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce title="Odenen Siparis" count={formatInteger(summary.paidOrderCount)} extra="Odeme tamamlanan siparis" />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce title="Aktif Etkinlik" count={formatInteger(summary.activeEventCount)} extra="Yayindaki etkinlik" />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce title="Bekleyen Iade" count={formatInteger(summary.pendingRefundCount)} extra="Bekleyen iade talebi" />
      </Grid>
      <Grid size={12}>
        <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Ozet API: /admin/dashboard/summary
          </Typography>
        </Stack>
      </Grid>
    </>
  );
}
