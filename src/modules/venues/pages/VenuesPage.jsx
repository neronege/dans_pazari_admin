'use client';

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import MainCard from 'components/MainCard';
import useVenues from 'modules/venues/hooks/useVenues';
import { createVenue, deleteVenue, getVenueDetail, updateVenue, updateVenueActive } from 'modules/venues/api/venues.service';
import { getHumanReadableError } from 'shared/api';

const initialForm = {
  name: '',
  slug: '',
  city: '',
  district: '',
  address: '',
  latitude: '',
  longitude: '',
  description: '',
  capacity: '',
  isActive: true
};

export default function VenuesPage() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const { venues, isLoading, error, refresh } = useVenues({ city, search });

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(initialForm);
    setActionError('');
    setDialogOpen(true);
  };

  const openEditDialog = async (venueId) => {
    try {
      setActionError('');
      const detail = await getVenueDetail(venueId);

      setEditingId(venueId);
      setForm({
        name: detail?.name || '',
        slug: detail?.slug || '',
        city: detail?.city || '',
        district: detail?.district || '',
        address: detail?.address || '',
        latitude: detail?.latitude ?? '',
        longitude: detail?.longitude ?? '',
        description: detail?.description || '',
        capacity: detail?.capacity ?? '',
        isActive: detail?.isActive ?? true
      });
      setDialogOpen(true);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const submitForm = async () => {
    setSaving(true);
    setActionError('');

    const payload = {
      name: form.name,
      slug: form.slug || null,
      city: form.city,
      district: form.district || null,
      address: form.address,
      latitude: form.latitude === '' ? null : Number(form.latitude),
      longitude: form.longitude === '' ? null : Number(form.longitude),
      description: form.description || null,
      capacity: form.capacity === '' ? null : Number(form.capacity),
      isActive: Boolean(form.isActive)
    };

    try {
      if (editingId) {
        await updateVenue(editingId, payload);
      } else {
        await createVenue(payload);
      }

      setDialogOpen(false);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (venue) => {
    try {
      setActionError('');
      await updateVenueActive(venue.id, !venue.isActive);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const removeVenue = async (venue) => {
    const confirmed = window.confirm(`${venue.name} mekanını silmek istiyor musunuz?`);
    if (!confirmed) {
      return;
    }

    try {
      setActionError('');
      await deleteVenue(venue.id);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  return (
    <>
      <MainCard
        title="Mekan Yönetimi"
        secondary={
          <Button variant="contained" onClick={openCreateDialog}>
            Yeni Mekan
          </Button>
        }
      >
        <Stack sx={{ gap: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
            <TextField
              label="Ara"
              placeholder="Mekan adı veya şehir"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              fullWidth
            />
            <TextField label="Şehir" value={city} onChange={(event) => setCity(event.target.value)} sx={{ minWidth: 220 }} />
          </Stack>

          {error && <Alert severity="error">Mekan listesi alınamadı.</Alert>}
          {actionError && <Alert severity="error">{actionError}</Alert>}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Ad</TableCell>
                  <TableCell>Şehir</TableCell>
                  <TableCell>İlçe</TableCell>
                  <TableCell>Kapasite</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && venues.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Gösterilecek mekan bulunamadı.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  venues.map((venue) => (
                    <TableRow key={venue.id} hover>
                      <TableCell>{venue.name}</TableCell>
                      <TableCell>{venue.city}</TableCell>
                      <TableCell>{venue.district || '-'}</TableCell>
                      <TableCell>{venue.capacity ?? '-'}</TableCell>
                      <TableCell>{venue.isActive ? 'Aktif' : 'Pasif'}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => openEditDialog(venue.id)}>
                          Düzenle
                        </Button>
                        <Button size="small" onClick={() => toggleActive(venue)}>
                          {venue.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                        </Button>
                        <Button size="small" color="error" onClick={() => removeVenue(venue)}>
                          Sil
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </MainCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Mekan Düzenle' : 'Mekan Oluştur'}</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, mt: 1 }}>
            <TextField
              label="Ad"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <TextField label="Slug" value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
            <TextField
              label="Şehir"
              value={form.city}
              onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
              required
            />
            <TextField
              label="İlçe"
              value={form.district}
              onChange={(event) => setForm((prev) => ({ ...prev, district: event.target.value }))}
            />
            <TextField
              label="Adres"
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              required
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
              <TextField
                type="number"
                label="Enlem"
                value={form.latitude}
                onChange={(event) => setForm((prev) => ({ ...prev, latitude: event.target.value }))}
                fullWidth
              />
              <TextField
                type="number"
                label="Boylam"
                value={form.longitude}
                onChange={(event) => setForm((prev) => ({ ...prev, longitude: event.target.value }))}
                fullWidth
              />
            </Stack>
            <TextField
              type="number"
              label="Kapasite"
              value={form.capacity}
              onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
            />
            <TextField
              label="Açıklama"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              multiline
              minRows={3}
            />
            <FormControlLabel
              control={
                <Switch checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />
              }
              label="Aktif"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Vazgeç</Button>
          <Button
            variant="contained"
            onClick={submitForm}
            disabled={saving || !form.name.trim() || !form.city.trim() || !form.address.trim()}
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
