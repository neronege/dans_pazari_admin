'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
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
import { getGateEventDetail, scanTicket } from 'modules/tickets/api/tickets.service';
import useGateEvents from 'modules/tickets/hooks/useGateEvents';
import { loadGateContext, saveGateContext } from 'modules/tickets/utils/gateContext';
import { getScanResultMeta, playScanFeedback } from 'modules/tickets/utils/scanResultMeta';
import { getHumanReadableError } from 'shared/api';

function formatSessionLabel(session) {
  const start = session?.startsAtUtc || session?.startsAt || '';
  const date = start ? new Date(start) : null;
  const when =
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })
      : 'Seans';
  return when;
}

export default function TicketsPage() {
  const { events, isLoading: eventsLoading } = useGateEvents({ status: 'Published' });
  const [context, setContext] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [payload, setPayload] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanError, setScanError] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [history, setHistory] = useState([]);
  const scannerRef = useRef(null);
  const scanBusyRef = useRef(false);
  const readerId = 'gate-qr-reader';

  useEffect(() => {
    setContext(loadGateContext());
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setSessions([]);
      setSelectedSessionId('');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setSessionsLoading(true);
        const detail = await getGateEventDetail(selectedEventId);
        if (cancelled) {
          return;
        }
        const list = Array.isArray(detail?.sessions) ? detail.sessions : [];
        setSessions(list);
        setSelectedSessionId((prev) => (list.some((s) => s.id === prev) ? prev : list[0]?.id || ''));
      } catch {
        if (!cancelled) {
          setSessions([]);
          setSelectedSessionId('');
        }
      } finally {
        if (!cancelled) {
          setSessionsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedEventId]);

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setCameraOn(false);
    if (!scanner) {
      return;
    }
    try {
      await scanner.stop();
    } catch {
      // ignore
    }
    try {
      await scanner.clear();
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const submitScan = useCallback(
    async (rawPayload) => {
      const trimmed = String(rawPayload || '').trim();
      if (!trimmed || !context?.eventId || scanBusyRef.current) {
        return;
      }

      scanBusyRef.current = true;
      setIsScanning(true);
      setScanError('');

      try {
        const result = await scanTicket({
          payload: trimmed,
          expectedEventId: context.eventId,
          expectedSessionId: context.sessionId || undefined
        });

        const normalized = {
          ...result,
          resultCode: result?.resultCode || 'unknown',
          resultMessage: result?.resultMessage || 'Sonuç mesajı yok.'
        };

        setLastResult(normalized);
        setHistory((prev) => [normalized, ...prev].slice(0, 30));
        playScanFeedback(Boolean(normalized.isSuccessful));
        setPayload('');
      } catch (requestError) {
        setScanError(getHumanReadableError(requestError?.problem) || requestError?.message);
        playScanFeedback(false);
      } finally {
        setIsScanning(false);
        // Kısa debounce: aynı QR’ın ardışık okunmasını kes
        setTimeout(() => {
          scanBusyRef.current = false;
        }, 1200);
      }
    },
    [context]
  );

  const startCamera = async () => {
    setCameraError('');
    await stopCamera();

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(readerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          submitScan(decoded);
        },
        () => {}
      );
      setCameraOn(true);
    } catch (error) {
      setCameraError(error?.message || 'Kamera açılamadı. Manuel giriş kullanın.');
      setCameraOn(false);
      scannerRef.current = null;
    }
  };

  const lockGate = () => {
    const event = events.find((row) => row.id === selectedEventId);
    if (!event) {
      return;
    }
    const session = sessions.find((row) => row.id === selectedSessionId);
    const next = {
      eventId: event.id,
      eventTitle: event.title || event.name || 'Etkinlik',
      sessionId: session?.id || null,
      sessionLabel: session ? formatSessionLabel(session) : null
    };
    saveGateContext(next);
    setContext(next);
    setLastResult(null);
    setScanError('');
  };

  const resultMeta = getScanResultMeta(lastResult?.resultCode);

  if (!context) {
    return (
      <MainCard title="Kapı / Bilet Tarama">
        <Stack sx={{ gap: 2 }}>
          <Alert severity="info">
            Önce etkinlik (ve mümkünse seans) seçin. Tarama bu bağlama kilitlenir; yanlış etkinlik bileti reddedilir.
          </Alert>
          <TextField
            select
            label="Etkinlik"
            value={selectedEventId}
            onChange={(event) => setSelectedEventId(event.target.value)}
            disabled={eventsLoading}
            fullWidth
          >
            {(events || []).map((event) => (
              <MenuItem key={event.id} value={event.id}>
                {event.title || event.name || event.id}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Seans (önerilir)"
            value={selectedSessionId}
            onChange={(event) => setSelectedSessionId(event.target.value)}
            disabled={!selectedEventId || sessionsLoading}
            fullWidth
            helperText="Seans seçilirse yalnızca o seans biletleri geçer."
          >
            <MenuItem value="">Tüm seanslar (yalnızca etkinlik kilidi)</MenuItem>
            {sessions.map((session) => (
              <MenuItem key={session.id} value={session.id}>
                {formatSessionLabel(session)}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" size="large" onClick={lockGate} disabled={!selectedEventId}>
            Kapıyı kilitle ve taramaya geç
          </Button>
        </Stack>
      </MainCard>
    );
  }

  return (
    <MainCard
      title="Kapı Tarama"
      secondary={
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1, width: { xs: '100%', sm: 'auto' } }}>
          <Button component={Link} href="/tickets/monitor" size="small" fullWidth>
            Monitör
          </Button>
        </Stack>
      }
    >
      <Stack sx={{ gap: 2 }}>
        <Alert severity="success">
          <Typography fontWeight={600}>{context.eventTitle}</Typography>
          <Typography variant="body2">
            {context.sessionLabel ? `Seans: ${context.sessionLabel}` : 'Seans kilidi yok (yalnızca etkinlik)'}
          </Typography>
        </Alert>

        <Box
          id={readerId}
          sx={{
            width: '100%',
            maxWidth: 420,
            mx: 'auto',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'grey.900',
            minHeight: cameraOn ? 280 : 0
          }}
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1 }}>
          {!cameraOn ? (
            <Button variant="contained" onClick={startCamera} disabled={isScanning}>
              Kamerayı aç
            </Button>
          ) : (
            <Button variant="outlined" color="inherit" onClick={stopCamera}>
              Kamerayı kapat
            </Button>
          )}
        </Stack>

        {cameraError && <Alert severity="warning">{cameraError}</Alert>}

        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
          <TextField
            label="QR Payload (manuel)"
            placeholder="Kamera yoksa yapıştırın"
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submitScan(payload);
              }
            }}
            fullWidth
          />
          <Button
            variant="contained"
            onClick={() => submitScan(payload)}
            disabled={isScanning || !payload.trim()}
            fullWidth
            sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 120 } }}
          >
            {isScanning ? 'Taranıyor...' : 'Tara'}
          </Button>
        </Stack>

        {scanError && <Alert severity="error">{scanError}</Alert>}

        {lastResult && (
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: lastResult.isSuccessful ? 'success.light' : 'error.light',
              color: 'common.black',
              textAlign: 'center'
            }}
          >
            <Typography variant="h4" sx={{ mb: 1 }}>
              {resultMeta.label}
            </Typography>
            <Typography sx={{ mb: 1 }}>{lastResult.resultMessage}</Typography>
            <Typography variant="body2">
              {lastResult.holderName || '-'} · {lastResult.ticketNumber || '-'}
            </Typography>
            <Chip label={resultMeta.label} color={resultMeta.color} size="small" sx={{ mt: 1 }} />
          </Box>
        )}

        <TableContainer sx={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Table
            size="small"
            sx={{
              minWidth: 900,
              '& .MuiTableCell-root': {
                whiteSpace: 'nowrap'
              }
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Zaman</TableCell>
                <TableCell>Sonuç</TableCell>
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
                const meta = getScanResultMeta(item.resultCode);
                return (
                  <TableRow key={`${item.scannedAtUtc || 'scan'}-${index}`} hover>
                    <TableCell>
                      {item.scannedAtUtc ? new Date(item.scannedAtUtc).toLocaleTimeString('tr-TR') : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip label={meta.label} color={meta.color} size="small" />
                    </TableCell>
                    <TableCell>{item.ticketNumber || '-'}</TableCell>
                    <TableCell>{item.holderName || '-'}</TableCell>
                    <TableCell sx={{ minWidth: 280 }}>
                      <Typography variant="body2" noWrap>
                        {item.resultMessage || '-'}
                      </Typography>
                    </TableCell>
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
