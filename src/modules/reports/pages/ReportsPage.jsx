'use client';

import { useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MainCard from 'components/MainCard';
import { exportSalesReportCsv } from 'modules/reports/api';
import useReports from 'modules/reports/hooks/useReports';
import { getHumanReadableError } from 'shared/api';

function toIsoStart(dateValue) {
  if (!dateValue) {
    return '';
  }

  return new Date(`${dateValue}T00:00:00`).toISOString();
}

function toIsoEnd(dateValue) {
  if (!dateValue) {
    return '';
  }

  return new Date(`${dateValue}T23:59:59`).toISOString();
}

function field(value, fallback = '-') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return value;
}

export default function ReportsPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [actionError, setActionError] = useState('');

  const fromUtc = toIsoStart(fromDate);
  const toUtc = toIsoEnd(toDate);

  const { sales, performanceRows, isLoading, salesError, performanceError } = useReports({
    fromUtc,
    toUtc
  });

  const reportErrorMessage =
    getHumanReadableError(salesError?.problem) ||
    salesError?.message ||
    getHumanReadableError(performanceError?.problem) ||
    performanceError?.message ||
    'Rapor verileri alinamadi.';

  const onExportCsv = async () => {
    try {
      setActionError('');
      const blob = await exportSalesReportCsv({ fromUtc, toUtc });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `satis-raporu-${fromDate}-${toDate}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  return (
    <Stack sx={{ gap: 2 }}>
      <MainCard title="Rapor Filtreleri">
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
          <TextField
            type="date"
            label="Başlangıç"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            label="Bitiş"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" onClick={onExportCsv}>
            Satış CSV Dışa Aktar
          </Button>
        </Stack>
      </MainCard>

      {(salesError || performanceError) && <Alert severity="error">{reportErrorMessage}</Alert>}
      {actionError && <Alert severity="error">{actionError}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <MainCard>
            <Typography variant="subtitle2" color="text.secondary">
              Brüt Satış
            </Typography>
            <Typography variant="h4">{field(sales?.grossSalesAmount ?? sales?.grossAmount ?? sales?.totalAmount, '0')}</Typography>
          </MainCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <MainCard>
            <Typography variant="subtitle2" color="text.secondary">
              Net Satış
            </Typography>
            <Typography variant="h4">{field(sales?.netSalesAmount ?? sales?.netAmount, '0')}</Typography>
          </MainCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <MainCard>
            <Typography variant="subtitle2" color="text.secondary">
              Toplam Bilet
            </Typography>
            <Typography variant="h4">{field(sales?.ticketsSold ?? sales?.totalTickets ?? sales?.ticketCount, '0')}</Typography>
          </MainCard>
        </Grid>
      </Grid>

      <MainCard title="Etkinlik Performansı">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Etkinlik</TableCell>
                <TableCell>Bilet</TableCell>
                <TableCell>Brüt Satış</TableCell>
                <TableCell>Net Satış</TableCell>
                <TableCell>İade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && performanceRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Gösterilecek performans satırı bulunamadı.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                performanceRows.map((row, index) => (
                  <TableRow key={row.eventId || row.id || index} hover>
                    <TableCell>{field(row.eventTitle || row.title || row.eventName)}</TableCell>
                    <TableCell>{field(row.ticketsSold || row.ticketCount, 0)}</TableCell>
                    <TableCell>{field(row.grossSalesAmount || row.grossAmount, 0)}</TableCell>
                    <TableCell>{field(row.netSalesAmount || row.netAmount, 0)}</TableCell>
                    <TableCell>{field(row.refundCount || row.refunds, 0)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </MainCard>
    </Stack>
  );
}
