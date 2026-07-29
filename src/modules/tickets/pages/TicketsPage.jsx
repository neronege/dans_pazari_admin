'use client';

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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
import { scanTicket } from 'modules/tickets/api/tickets.service';
import { getHumanReadableError } from 'shared/api';

function getResultMeta(resultCode) {
  const code = String(resultCode || '').toLowerCase();

  if (code === 'valid') {
    return { label: 'Geçerli', color: 'success' };
  }

  if (code === 'already_used') {
    return { label: 'Daha Önce Kullanılmış', color: 'warning' };
  }

  if (code === 'cancelled' || code === 'refunded' || code === 'not_active') {
    return { label: 'Geçersiz Durum', color: 'warning' };
  }

  if (code === 'not_found') {
    return { label: 'Bulunamadı', color: 'error' };
  }

  if (code === 'invalid') {
    return { label: 'Format Geçersiz', color: 'error' };
  }

  return { label: 'Bilinmiyor', color: 'default' };
}

export default function TicketsPage() {
  const [payload, setPayload] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [history, setHistory] = useState([]);

  const onScan = async () => {
    if (!payload.trim()) {
      return;
    }

    try {
      setIsScanning(true);
      setScanError('');
      const result = await scanTicket(payload.trim());
      const resultCode = result?.resultCode || 'unknown';
      const resultMessage = result?.resultMessage || 'Sonuç mesajı bulunamadı.';

      const normalized = {
        ...result,
        resultCode,
        resultMessage
      };

      setLastResult(normalized);
      setHistory((prev) => [normalized, ...prev].slice(0, 25));
    } catch (requestError) {
      setScanError(getHumanReadableError(requestError?.problem) || requestError?.message);
    } finally {
      setIsScanning(false);
    }
  };

  const resultMeta = getResultMeta(lastResult?.resultCode);

  return (
    <MainCard title="Bilet Tarama">
      <Stack sx={{ gap: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
          <TextField
            label="QR Payload"
            placeholder="Okunan ham QR metni"
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
            fullWidth
          />
          <Button variant="contained" onClick={onScan} disabled={isScanning || !payload.trim()}>
            {isScanning ? 'Taranıyor...' : 'Tara'}
          </Button>
        </Stack>

        {scanError && <Alert severity="error">{scanError}</Alert>}

        {lastResult && (
          <Alert severity={lastResult?.isSuccessful ? 'success' : 'warning'}>
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} sx={{ gap: 1 }}>
              <Typography>{lastResult.resultMessage || 'Tarama sonucu alindi.'}</Typography>
              <Chip label={resultMeta.label} color={resultMeta.color} size="small" />
            </Stack>
          </Alert>
        )}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tarih</TableCell>
                <TableCell>Sonuc</TableCell>
                <TableCell>Bilet No</TableCell>
                <TableCell>Ad Soyad</TableCell>
                <TableCell>Mesaj</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Henüz tarama yok.
                  </TableCell>
                </TableRow>
              )}

              {history.map((item, index) => {
                const meta = getResultMeta(item.resultCode);

                return (
                  <TableRow key={`${item.scannedAtUtc || 'scan'}-${index}`} hover>
                    <TableCell>{item.scannedAtUtc || '-'}</TableCell>
                    <TableCell>
                      <Chip label={meta.label} color={meta.color} size="small" />
                    </TableCell>
                    <TableCell>{item.ticketNumber || '-'}</TableCell>
                    <TableCell>{item.holderName || '-'}</TableCell>
                    <TableCell>{item.resultMessage || '-'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </MainCard>
  );
}
