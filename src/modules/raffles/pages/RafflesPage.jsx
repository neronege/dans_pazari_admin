'use client';

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
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
import {
  cancelRaffle,
  createRaffle,
  deleteRaffle,
  getRaffleDetail,
  getRaffleEntries,
  getRaffleWinners,
  openRaffle,
  scheduleRaffle,
  updateRaffle
} from 'modules/raffles/api/raffles.service';
import useRaffles from 'modules/raffles/hooks/useRaffles';
import { getHumanReadableError } from 'shared/api';
import { clearFieldError, getFieldError } from 'shared/ui/fieldErrors';

const initialForm = {
  title: '',
  startsAtUtc: '',
  endsAtUtc: '',
  description: ''
};

function field(value, fallback = '-') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return value;
}

function toDateTimeLocalFromIso(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function toIsoFromDateTimeLocal(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export default function RafflesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [entriesCount, setEntriesCount] = useState(0);
  const [winnersCount, setWinnersCount] = useState(0);
  const [actionError, setActionError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const { raffles, totalCount, isLoading, error, refresh } = useRaffles({
    page,
    pageSize: 20,
    search,
    status
  });

  const pageCount = Math.max(1, Math.ceil(totalCount / 20));

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setActionError('');
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEdit = async (raffleId) => {
    try {
      setActionError('');
      const detailResponse = await getRaffleDetail(raffleId);
      setEditingId(raffleId);
      setForm({
        title: detailResponse?.title || '',
        startsAtUtc: toDateTimeLocalFromIso(detailResponse?.startsAtUtc),
        endsAtUtc: toDateTimeLocalFromIso(detailResponse?.endsAtUtc),
        description: detailResponse?.description || ''
      });
      setFormErrors({});
      setDialogOpen(true);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const submitForm = async () => {
    setSaving(true);
    setActionError('');

    const nextErrors = {};
    const startsAtUtc = toIsoFromDateTimeLocal(form.startsAtUtc);
    const endsAtUtc = toIsoFromDateTimeLocal(form.endsAtUtc);

    if (!String(form.title || '').trim()) {
      nextErrors.title = 'Başlık zorunludur.';
    }

    if (!startsAtUtc) {
      nextErrors.startsAtUtc = 'Başlangıç tarihi zorunludur.';
    }

    if (!endsAtUtc) {
      nextErrors.endsAtUtc = 'Bitiş tarihi zorunludur.';
    }

    if (startsAtUtc && endsAtUtc && new Date(endsAtUtc).getTime() <= new Date(startsAtUtc).getTime()) {
      nextErrors.endsAtUtc = 'Bitiş zamanı başlangıçtan sonra olmalıdır.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      setSaving(false);
      return;
    }

    setFormErrors({});

    const payload = {
      title: form.title,
      startsAtUtc,
      endsAtUtc,
      description: form.description || null
    };

    try {
      if (editingId) {
        await updateRaffle(editingId, payload);
      } else {
        await createRaffle(payload);
      }
      setDialogOpen(false);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (raffleId) => {
    try {
      setActionError('');
      const [detailResponse, entriesResponse, winnersResponse] = await Promise.all([
        getRaffleDetail(raffleId),
        getRaffleEntries(raffleId, { page: 1, pageSize: 1 }),
        getRaffleWinners(raffleId)
      ]);

      setDetail(detailResponse);
      setEntriesCount(entriesResponse.totalCount || 0);
      setWinnersCount(Array.isArray(winnersResponse) ? winnersResponse.length : 0);
      setDetailDialogOpen(true);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onSchedule = async (raffle) => {
    try {
      setActionError('');
      await scheduleRaffle(raffle.id);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onOpen = async (raffle) => {
    try {
      setActionError('');
      await openRaffle(raffle.id);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onCancel = async (raffle) => {
    const confirmed = window.confirm(`${raffle.title} çekilişini iptal etmek istiyor musunuz?`);
    if (!confirmed) {
      return;
    }

    try {
      setActionError('');
      await cancelRaffle(raffle.id);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onDelete = async (raffle) => {
    const confirmed = window.confirm(`${raffle.title} çekilişini silmek istiyor musunuz?`);
    if (!confirmed) {
      return;
    }

    try {
      setActionError('');
      await deleteRaffle(raffle.id);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  return (
    <>
      <MainCard
        title="Çekiliş Yönetimi"
        secondary={
          <Button variant="contained" onClick={openCreate}>
            Yeni Çekiliş
          </Button>
        }
      >
        <Stack sx={{ gap: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2 }}>
            <TextField
              label="Ara"
              placeholder="Çekiliş başlığı"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              fullWidth
            />
            <TextField
              select
              label="Durum"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Tüm Durumlar</MenuItem>
              <MenuItem value="Draft">Taslak</MenuItem>
              <MenuItem value="Scheduled">Planlandı</MenuItem>
              <MenuItem value="Open">Açık</MenuItem>
              <MenuItem value="Drawing">Çekiliş Yapılıyor</MenuItem>
              <MenuItem value="Completed">Tamamlandı</MenuItem>
              <MenuItem value="Cancelled">İptal Edildi</MenuItem>
            </TextField>
          </Stack>

          {error && <Alert severity="error">Çekiliş listesi alınamadı.</Alert>}
          {actionError && <Alert severity="error">{actionError}</Alert>}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Başlık</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Başlangıç</TableCell>
                  <TableCell>Bitiş</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
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

                {!isLoading && raffles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Gösterilecek çekiliş bulunamadı.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  raffles.map((raffle) => (
                    <TableRow key={raffle.id} hover>
                      <TableCell>{field(raffle.title)}</TableCell>
                      <TableCell>{field(raffle.status)}</TableCell>
                      <TableCell>{field(raffle.startsAtUtc)}</TableCell>
                      <TableCell>{field(raffle.endsAtUtc)}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => openDetail(raffle.id)}>
                          Detay
                        </Button>
                        <Button size="small" onClick={() => openEdit(raffle.id)}>
                          Düzenle
                        </Button>
                        <Button size="small" onClick={() => onSchedule(raffle)}>
                          Planla
                        </Button>
                        <Button size="small" onClick={() => onOpen(raffle)}>
                          Aç
                        </Button>
                        <Button size="small" color="warning" onClick={() => onCancel(raffle)}>
                          İptal Et
                        </Button>
                        <Button size="small" color="error" onClick={() => onDelete(raffle)}>
                          Sil
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" justifyContent="flex-end">
            <Pagination count={pageCount} page={page} onChange={(_, nextPage) => setPage(nextPage)} color="primary" />
          </Stack>
        </Stack>
      </MainCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Çekiliş Düzenle' : 'Çekiliş Oluştur'}</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, mt: 1 }}>
            <TextField
              label="Başlık"
              value={form.title}
              onChange={(event) => {
                const value = event.target.value;
                setForm((prev) => ({ ...prev, title: value }));
                setFormErrors((prev) => clearFieldError(prev, 'title'));
              }}
              required
              error={Boolean(getFieldError(formErrors, 'title'))}
              helperText={getFieldError(formErrors, 'title')}
            />
            <TextField
              type="datetime-local"
              label="Başlangıç"
              value={form.startsAtUtc}
              onChange={(event) => {
                const value = event.target.value;
                setForm((prev) => ({ ...prev, startsAtUtc: value }));
                setFormErrors((prev) => clearFieldError(prev, 'startsAtUtc'));
              }}
              InputLabelProps={{ shrink: true }}
              required
              error={Boolean(getFieldError(formErrors, 'startsAtUtc'))}
              helperText={getFieldError(formErrors, 'startsAtUtc')}
            />
            <TextField
              type="datetime-local"
              label="Bitiş"
              value={form.endsAtUtc}
              onChange={(event) => {
                const value = event.target.value;
                setForm((prev) => ({ ...prev, endsAtUtc: value }));
                setFormErrors((prev) => clearFieldError(prev, 'endsAtUtc'));
              }}
              InputLabelProps={{ shrink: true }}
              required
              error={Boolean(getFieldError(formErrors, 'endsAtUtc'))}
              helperText={getFieldError(formErrors, 'endsAtUtc')}
            />
            <TextField
              label="Açıklama"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Vazgeç</Button>
          <Button variant="contained" onClick={submitForm} disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Çekiliş Detayı</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 1.25, mt: 1 }}>
            <Typography>Başlık: {field(detail?.title)}</Typography>
            <Typography>Durum: {field(detail?.status)}</Typography>
            <Typography>Başlangıç: {field(detail?.startsAtUtc)}</Typography>
            <Typography>Bitiş: {field(detail?.endsAtUtc)}</Typography>
            <Typography>Açıklama: {field(detail?.description)}</Typography>
            <Typography>Katılım Sayısı: {entriesCount}</Typography>
            <Typography>Kazanan Sayısı: {winnersCount}</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
