'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
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
import useGateEvents from 'modules/tickets/hooks/useGateEvents';
import { createPlatformHubConnection, ensureHubStarted } from 'modules/tickets/api/platformHub';
import { getGateMonitorStats } from 'modules/tickets/api/tickets.service';
import { loadGateContext } from 'modules/tickets/utils/gateContext';
import { getScanResultMeta } from 'modules/tickets/utils/scanResultMeta';

const STATS_POLL_MS = 15000;

export default function TicketsMonitorPage() {
  const gate = loadGateContext();
  const { events } = useGateEvents({ status: 'Published' });
  const [eventId, setEventId] = useState(gate?.eventId || '');
  const [connected, setConnected] = useState(false);
  const [hubError, setHubError] = useState('');
  const [items, setItems] = useState([]);
  const [gateStats, setGateStats] = useState({ soldTicketCount: 0, checkedInCount: 0 });

  const refreshGateStats = useCallback(async (id) => {
    if (!id) {
      setGateStats({ soldTicketCount: 0, checkedInCount: 0 });
      return;
    }

    try {
      const stats = await getGateMonitorStats(id);
      setGateStats({
        soldTicketCount: Number(stats?.soldTicketCount ?? 0),
        checkedInCount: Number(stats?.checkedInCount ?? 0)
      });
    } catch {
      // Canlı tarama akışını bozma; chip'ler son bilinen değeri tutar.
    }
  }, []);

  useEffect(() => {
    if (!eventId) {
      setGateStats({ soldTicketCount: 0, checkedInCount: 0 });
      return undefined;
    }

    refreshGateStats(eventId);
    const timer = setInterval(() => refreshGateStats(eventId), STATS_POLL_MS);
    return () => clearInterval(timer);
  }, [eventId, refreshGateStats]);

  useEffect(() => {
    if (!eventId) {
      setConnected(false);
      return undefined;
    }

    const connection = createPlatformHubConnection();
    let active = true;

    const onScanned = (result) => {
      if (!active) {
        return;
      }
      setItems((prev) => [result, ...prev].slice(0, 50));
      refreshGateStats(eventId);
    };

    (async () => {
      try {
        setHubError('');
        connection.on('TicketScanned', onScanned);
        await ensureHubStarted(connection);
        await connection.invoke('JoinEventGate', eventId);
        if (active) {
          setConnected(true);
        }
      } catch (error) {
        if (active) {
          setConnected(false);
          setHubError(error?.message || 'SignalR bağlantısı kurulamadı.');
        }
      }
    })();

    return () => {
      active = false;
      connection.off('TicketScanned', onScanned);
      connection
        .invoke('LeaveEventGate', eventId)
        .catch(() => {})
        .finally(() => {
          connection.stop().catch(() => {});
        });
      setConnected(false);
    };
  }, [eventId, refreshGateStats]);

  const stats = useMemo(() => {
    const counts = { valid: 0, already_used: 0, wrong: 0, other: 0 };
    for (const item of items) {
      const code = String(item?.resultCode || '').toLowerCase();
      if (code === 'valid') counts.valid += 1;
      else if (code === 'already_used') counts.already_used += 1;
      else if (code === 'wrong_event' || code === 'wrong_session') counts.wrong += 1;
      else counts.other += 1;
    }
    return counts;
  }, [items]);

  return (
    <MainCard
      title="Kapı Monitörü"
      secondary={
        <Button component={Link} href="/tickets" size="small" fullWidth sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Tarayıcıya dön
        </Button>
      }
    >
      <Stack sx={{ gap: 2 }}>
        <TextField
          select
          label="İzlenen etkinlik"
          value={eventId}
          onChange={(event) => {
            setItems([]);
            setEventId(event.target.value);
          }}
          fullWidth
        >
          {(events || []).map((event) => (
            <MenuItem key={event.id} value={event.id}>
              {event.title || event.name || event.id}
            </MenuItem>
          ))}
        </TextField>

        <Alert severity={connected ? 'success' : 'warning'}>
          {connected ? 'Canlı bağlantı açık (JoinEventGate).' : 'Bağlantı yok — etkinlik seçin veya API URL / JWT kontrol edin.'}
        </Alert>
        {hubError && <Alert severity="error">{hubError}</Alert>}

        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Chip color="primary" label={`Satılan bilet: ${gateStats.soldTicketCount}`} />
          <Chip color="info" label={`Giriş yapan: ${gateStats.checkedInCount}`} />
          <Chip color="success" label={`Geçerli (oturum): ${stats.valid}`} />
          <Chip color="warning" label={`Tekrar: ${stats.already_used}`} />
          <Chip color="error" label={`Yanlış kapı: ${stats.wrong}`} />
          <Chip label={`Diğer: ${stats.other}`} />
        </Stack>

        <TableContainer sx={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Table
            size="small"
            sx={{
              minWidth: 1080,
              '& .MuiTableCell-root': {
                whiteSpace: 'nowrap'
              }
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Zaman</TableCell>
                <TableCell>Sonuç</TableCell>
                <TableCell>Bilet</TableCell>
                <TableCell>Ad Soyad</TableCell>
                <TableCell>Kapı Görevlisi</TableCell>
                <TableCell>Mesaj</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Henüz canlı tarama yok.
                  </TableCell>
                </TableRow>
              )}
              {items.map((item, index) => {
                const meta = getScanResultMeta(item.resultCode);
                return (
                  <TableRow key={`${item.scannedAtUtc || 'm'}-${item.ticketId || index}`} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {item.scannedAtUtc
                        ? new Date(item.scannedAtUtc).toLocaleString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip label={meta.label} color={meta.color} size="small" />
                    </TableCell>
                    <TableCell>{item.ticketNumber || '-'}</TableCell>
                    <TableCell>{item.holderName || '-'}</TableCell>
                    <TableCell>{item.scannedByName || '-'}</TableCell>
                    <TableCell sx={{ minWidth: 320 }}>
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

        <Typography variant="body2" color="text.secondary">
          Birden fazla kapı telefonu aynı anda tarayabilir; bu ekran seçili etkinliğin tüm taramalarını gösterir.
        </Typography>
      </Stack>
    </MainCard>
  );
}
