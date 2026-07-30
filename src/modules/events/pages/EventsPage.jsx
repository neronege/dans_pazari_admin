'use client';

import { useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MainCard from 'components/MainCard';
import { getCategories } from 'modules/categories/api/categories.service';
import useVenues from 'modules/venues/hooks/useVenues';
import {
  cancelEventSession,
  cancelEvent,
  createEventSession,
  createEvent,
  createTicketType,
  deleteEventBanner,
  deleteEventCover,
  deleteEventPhoto,
  deleteEventSession,
  deleteEvent,
  deleteTicketType,
  getEventDetail,
  publishEvent,
  startBulkRefunds,
  updateEventSession,
  updateTicketType,
  uploadEventCover,
  uploadEventBanner,
  uploadEventPhotos,
  setEventFeatured,
  unpublishEvent,
  updateEvent
} from 'modules/events/api/events.service';
import useEvents from 'modules/events/hooks/useEvents';
import useSWR from 'swr';
import { getHumanReadableError } from 'shared/api';

const initialForm = {
  title: '',
  description: '',
  categoryId: '',
  venueId: '',
  slug: '',
  shortDescription: '',
  isFeatured: false,
  metaTitle: '',
  metaDescription: ''
};

function flattenCategories(categories, level = 0) {
  return (categories || []).flatMap((category) => {
    const row = {
      ...category,
      level
    };

    return [row, ...flattenCategories(category.children || [], level + 1)];
  });
}

function normalizeEventStatus(value) {
  const status = String(value || '').toLowerCase();

  if (status === 'published') {
    return 'Published';
  }

  if (status === 'cancelled') {
    return 'Cancelled';
  }

  if (status === 'archived') {
    return 'Archived';
  }

  return 'Draft';
}

export default function EventsPage() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [opsDialogOpen, setOpsDialogOpen] = useState(false);
  const [opsEventId, setOpsEventId] = useState(null);
  const [opsEventTitle, setOpsEventTitle] = useState('');
  const [opsSessions, setOpsSessions] = useState([]);
  const [coverTargetEventId, setCoverTargetEventId] = useState(null);
  const [bannerTargetEventId, setBannerTargetEventId] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [existingBannerUrl, setExistingBannerUrl] = useState('');
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const { events, isLoading, error, refresh } = useEvents({ search, city, status, categoryId });
  const { venues } = useVenues({});
  const { data: categoryTree = [] } = useSWR('admin/categories-for-events', getCategories, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });

  const categoryOptions = useMemo(() => flattenCategories(categoryTree), [categoryTree]);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(initialForm);
    setCoverFile(null);
    setBannerFile(null);
    setGalleryFiles([]);
    setExistingPhotos([]);
    setExistingBannerUrl('');
    setActionError('');
    setDialogOpen(true);
  };

  const openEditDialog = async (eventId) => {
    try {
      setActionError('');
      const detail = await getEventDetail(eventId);

      setEditingId(eventId);
      setForm({
        title: detail?.title || detail?.name || '',
        description: detail?.description || '',
        categoryId: detail?.categoryId || '',
        venueId: detail?.venueId || '',
        slug: detail?.slug || '',
        shortDescription: detail?.shortDescription || '',
        isFeatured: detail?.isFeatured ?? false,
        metaTitle: detail?.metaTitle || '',
        metaDescription: detail?.metaDescription || ''
      });
      setExistingPhotos(Array.isArray(detail?.photos) ? detail.photos : []);
      setExistingBannerUrl(detail?.bannerImageUrl || '');
      setCoverFile(null);
      setBannerFile(null);
      setGalleryFiles([]);
      setDialogOpen(true);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const uploadSelectedMedia = async (eventId) => {
    if (coverFile) {
      await uploadEventCover(eventId, coverFile);
    }

    if (galleryFiles.length > 0) {
      await uploadEventPhotos(eventId, galleryFiles);
    }

    if (bannerFile) {
      await uploadEventBanner(eventId, bannerFile);
    }
  };

  const submitForm = async () => {
    setSaving(true);
    setActionError('');

    const payload = {
      title: form.title,
      description: form.description,
      categoryId: form.categoryId,
      venueId: form.venueId,
      slug: form.slug || null,
      shortDescription: form.shortDescription || null,
      isFeatured: Boolean(form.isFeatured),
      metaTitle: form.metaTitle || null,
      metaDescription: form.metaDescription || null
    };

    try {
      let targetEventId = editingId;

      if (editingId) {
        await updateEvent(editingId, payload);
      } else {
        const created = await createEvent(payload);
        targetEventId = created?.id || created?.eventId || null;
        if (!targetEventId) {
          throw new Error('Etkinlik olusturuldu ancak event id alinamadi.');
        }
        setEditingId(targetEventId);
      }

      await uploadSelectedMedia(targetEventId);

      setDialogOpen(false);
      setCoverFile(null);
      setBannerFile(null);
      setGalleryFiles([]);
      setExistingPhotos([]);
      setExistingBannerUrl('');
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    } finally {
      setSaving(false);
    }
  };

  const onPublishToggle = async (event) => {
    try {
      setActionError('');
      if (normalizeEventStatus(event.status) === 'Published') {
        await unpublishEvent(event.id);
      } else {
        await publishEvent(event.id);
      }
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onFeaturedToggle = async (event) => {
    try {
      setActionError('');
      await setEventFeatured(event.id, !event.isFeatured);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onCancel = async (event) => {
    const confirmed = window.confirm(`${event.title || event.name} etkinliğini iptal etmek istiyor musunuz?`);
    if (!confirmed) {
      return;
    }

    try {
      setActionError('');
      await cancelEvent(event.id);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onDelete = async (event) => {
    const confirmed = window.confirm(`${event.title || event.name} etkinliğini silmek istiyor musunuz?`);
    if (!confirmed) {
      return;
    }

    try {
      setActionError('');
      await deleteEvent(event.id);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const parseSessions = (detail) => {
    if (Array.isArray(detail?.sessions)) {
      return detail.sessions;
    }

    if (Array.isArray(detail?.eventSessions)) {
      return detail.eventSessions;
    }

    if (Array.isArray(detail?.items)) {
      return detail.items;
    }

    return [];
  };

  const reloadOperations = async (eventId) => {
    const detail = await getEventDetail(eventId);
    setOpsSessions(parseSessions(detail));
    setOpsEventTitle(detail?.title || detail?.name || 'Etkinlik');
  };

  const openOperations = async (eventId) => {
    try {
      setActionError('');
      setOpsEventId(eventId);
      await reloadOperations(eventId);
      setOpsDialogOpen(true);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const requestCoverUpload = (eventId) => {
    setCoverTargetEventId(eventId);
    fileInputRef.current?.click();
  };

  const requestBannerUpload = (eventId) => {
    setBannerTargetEventId(eventId);
    bannerInputRef.current?.click();
  };

  const onCoverFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !coverTargetEventId) {
      return;
    }

    try {
      setActionError('');
      await uploadEventCover(coverTargetEventId, file);
      await refresh();

      if (opsDialogOpen && opsEventId === coverTargetEventId) {
        await reloadOperations(coverTargetEventId);
      }
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    } finally {
      event.target.value = '';
      setCoverTargetEventId(null);
    }
  };

  const onCoverDelete = async (eventId) => {
    const confirmed = window.confirm('Etkinlik kapağını silmek istiyor musunuz?');
    if (!confirmed) {
      return;
    }

    try {
      setActionError('');
      await deleteEventCover(eventId);
      await refresh();

      if (opsDialogOpen && opsEventId === eventId) {
        await reloadOperations(eventId);
      }
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onBannerFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !bannerTargetEventId) {
      return;
    }

    try {
      setActionError('');
      await uploadEventBanner(bannerTargetEventId, file);
      await refresh();

      if (opsDialogOpen && opsEventId === bannerTargetEventId) {
        await reloadOperations(bannerTargetEventId);
      }
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    } finally {
      event.target.value = '';
      setBannerTargetEventId(null);
    }
  };

  const onBannerDelete = async (eventId) => {
    const confirmed = window.confirm('Etkinlik banner görselini silmek istiyor musunuz?');
    if (!confirmed) {
      return;
    }

    try {
      setActionError('');
      await deleteEventBanner(eventId);
      await refresh();

      if (opsDialogOpen && opsEventId === eventId) {
        await reloadOperations(eventId);
      }
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onDeletePhoto = async (photoId) => {
    if (!editingId) {
      return;
    }

    try {
      setActionError('');
      await deleteEventPhoto(editingId, photoId);
      setExistingPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onStartBulkRefunds = async (eventId) => {
    const reason = window.prompt('Toplu iade nedeni');
    if (!reason || !reason.trim()) {
      return;
    }

    try {
      setActionError('');
      const result = await startBulkRefunds(eventId, reason.trim());
      const createdCount = result?.createdCount ?? 0;
      const skippedCount = result?.skippedCount ?? 0;
      window.alert(`Toplu iade isteği oluşturuldu. Oluşan: ${createdCount}, Atlanan: ${skippedCount}`);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onCreateSession = async () => {
    if (!opsEventId) {
      return;
    }

    const startsAtUtc = window.prompt('Seans başlangıç UTC (örnek: 2026-10-20T19:00:00Z)');
    if (!startsAtUtc || !startsAtUtc.trim()) {
      return;
    }

    const endsAtUtc = window.prompt('Seans bitiş UTC (örnek: 2026-10-20T22:00:00Z)');
    if (!endsAtUtc || !endsAtUtc.trim()) {
      return;
    }

    const doorOpensNote = window.prompt('Kapı açılış notu (opsiyonel)') || '';

    try {
      setActionError('');
      await createEventSession(opsEventId, {
        startsAtUtc: startsAtUtc.trim(),
        endsAtUtc: endsAtUtc.trim(),
        doorOpensNote: doorOpensNote.trim() || null
      });
      await reloadOperations(opsEventId);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onUpdateSession = async (session) => {
    if (!opsEventId) {
      return;
    }

    const startsAtUtc = window.prompt('Seans başlangıç UTC', session.startsAtUtc || '');
    if (!startsAtUtc || !startsAtUtc.trim()) {
      return;
    }

    const endsAtUtc = window.prompt('Seans bitiş UTC', session.endsAtUtc || '');
    if (!endsAtUtc || !endsAtUtc.trim()) {
      return;
    }

    const doorOpensNote = window.prompt('Kapı açılış notu (opsiyonel)', session.doorOpensNote || '') || '';

    try {
      setActionError('');
      await updateEventSession(opsEventId, session.id, {
        startsAtUtc: startsAtUtc.trim(),
        endsAtUtc: endsAtUtc.trim(),
        doorOpensNote: doorOpensNote.trim() || null
      });
      await reloadOperations(opsEventId);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onCancelSession = async (session) => {
    if (!opsEventId) {
      return;
    }

    const confirmed = window.confirm('Bu seansı iptal etmek istiyor musunuz?');
    if (!confirmed) {
      return;
    }

    try {
      setActionError('');
      await cancelEventSession(opsEventId, session.id);
      await reloadOperations(opsEventId);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onDeleteSession = async (session) => {
    if (!opsEventId) {
      return;
    }

    const confirmed = window.confirm('Bu seansı silmek istiyor musunuz?');
    if (!confirmed) {
      return;
    }

    try {
      setActionError('');
      await deleteEventSession(opsEventId, session.id);
      await reloadOperations(opsEventId);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  function parseTicketTypes(session) {
    if (Array.isArray(session?.ticketTypes)) {
      return session.ticketTypes;
    }

    if (Array.isArray(session?.tickets)) {
      return session.tickets;
    }

    if (Array.isArray(session?.items)) {
      return session.items;
    }

    return [];
  }

  const onCreateTicketType = async (session) => {
    if (!opsEventId) {
      return;
    }

    const name = window.prompt('Bilet tipi adı');
    if (!name || !name.trim()) {
      return;
    }

    const priceInput = window.prompt('Fiyat (örnek: 799.90)');
    if (!priceInput || Number.isNaN(Number(priceInput))) {
      return;
    }

    const capacityInput = window.prompt('Kapasite (örnek: 200)');
    if (!capacityInput || Number.isNaN(Number(capacityInput))) {
      return;
    }

    try {
      setActionError('');
      await createTicketType(opsEventId, session.id, {
        name: name.trim(),
        price: Number(priceInput),
        capacity: Number(capacityInput),
        isActive: true
      });
      await reloadOperations(opsEventId);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onUpdateTicketType = async (session, ticketType) => {
    if (!opsEventId) {
      return;
    }

    const name = window.prompt('Bilet tipi adı', ticketType.name || '');
    if (!name || !name.trim()) {
      return;
    }

    const priceInput = window.prompt('Fiyat', String(ticketType.price ?? ''));
    if (!priceInput || Number.isNaN(Number(priceInput))) {
      return;
    }

    const capacityInput = window.prompt('Kapasite', String(ticketType.capacity ?? ''));
    if (!capacityInput || Number.isNaN(Number(capacityInput))) {
      return;
    }

    try {
      setActionError('');
      await updateTicketType(opsEventId, session.id, ticketType.id, {
        name: name.trim(),
        price: Number(priceInput),
        capacity: Number(capacityInput),
        description: ticketType.description || null,
        currency: ticketType.currency || 'TRY',
        sortOrder: Number(ticketType.sortOrder || 0),
        maxPerOrder: ticketType.maxPerOrder ?? null,
        isActive: ticketType.isActive ?? true
      });
      await reloadOperations(opsEventId);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onDeleteTicketType = async (session, ticketType) => {
    if (!opsEventId) {
      return;
    }

    const confirmed = window.confirm('Bu bilet tipini silmek istiyor musunuz?');
    if (!confirmed) {
      return;
    }

    try {
      setActionError('');
      await deleteTicketType(opsEventId, session.id, ticketType.id);
      await reloadOperations(opsEventId);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onCoverFileChange} />
      <input ref={bannerInputRef} type="file" accept="image/*" hidden onChange={onBannerFileChange} />

      <MainCard
        title="Etkinlik Yönetimi"
        secondary={
          <Button variant="contained" onClick={openCreateDialog}>
            Yeni Etkinlik
          </Button>
        }
      >
        <Stack sx={{ gap: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
            <TextField
              label="Ara"
              placeholder="Etkinlik adı"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              fullWidth
            />
            <TextField label="Şehir" value={city} onChange={(event) => setCity(event.target.value)} sx={{ minWidth: 200 }} />
            <TextField select label="Durum" value={status} onChange={(event) => setStatus(event.target.value)} sx={{ minWidth: 180 }}>
              <MenuItem value="">Tüm Durumlar</MenuItem>
              <MenuItem value="Draft">Draft</MenuItem>
              <MenuItem value="Published">Published</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
              <MenuItem value="Archived">Archived</MenuItem>
            </TextField>
            <TextField
              select
              label="Kategori"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">Tüm Kategoriler</MenuItem>
              {categoryOptions.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {'- '.repeat(category.level)}
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {error && <Alert severity="error">Etkinlik listesi alınamadı.</Alert>}
          {actionError && <Alert severity="error">{actionError}</Alert>}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Başlık</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Kategori</TableCell>
                  <TableCell>Mekan</TableCell>
                  <TableCell>Kapak</TableCell>
                  <TableCell>Banner</TableCell>
                  <TableCell>Öne Çıkan</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && events.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Gösterilecek etkinlik bulunamadı.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  events.map((event) => (
                    <TableRow key={event.id} hover>
                      <TableCell>{event.title || event.name}</TableCell>
                      <TableCell>{normalizeEventStatus(event.status)}</TableCell>
                      <TableCell>{event.categoryName || '-'}</TableCell>
                      <TableCell>{event.venueName || '-'}</TableCell>
                      <TableCell>
                        {event.coverImageUrl ? (
                          <Box
                            component="img"
                            src={event.coverImageUrl}
                            alt="Kapak"
                            sx={{
                              width: 48,
                              height: 48,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: (theme) => `1px solid ${theme.palette.divider}`
                            }}
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {event.bannerImageUrl ? (
                          <Box
                            component="img"
                            src={event.bannerImageUrl}
                            alt="Banner"
                            sx={{
                              width: 84,
                              height: 48,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: (theme) => `1px solid ${theme.palette.divider}`
                            }}
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{event.isFeatured ? 'Evet' : 'Hayır'}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => openEditDialog(event.id)}>
                          Düzenle
                        </Button>
                        <Button size="small" onClick={() => onPublishToggle(event)}>
                          {normalizeEventStatus(event.status) === 'Published' ? 'Yayından Kaldır' : 'Yayınla'}
                        </Button>
                        <Button size="small" onClick={() => onFeaturedToggle(event)}>
                          {event.isFeatured ? 'Öne Çıkarmayı Kaldır' : 'Öne Çıkar'}
                        </Button>
                        <Button size="small" onClick={() => requestCoverUpload(event.id)}>
                          Kapak Yükle
                        </Button>
                        <Button size="small" onClick={() => onCoverDelete(event.id)}>
                          Kapak Sil
                        </Button>
                        <Button size="small" onClick={() => requestBannerUpload(event.id)}>
                          Banner Yükle
                        </Button>
                        <Button size="small" onClick={() => onBannerDelete(event.id)}>
                          Banner Sil
                        </Button>
                        <Button size="small" onClick={() => openOperations(event.id)}>
                          Seanslar
                        </Button>
                        <Button size="small" color="secondary" onClick={() => onStartBulkRefunds(event.id)}>
                          Toplu İade
                        </Button>
                        <Button size="small" color="warning" onClick={() => onCancel(event)}>
                          İptal Et
                        </Button>
                        <Button size="small" color="error" onClick={() => onDelete(event)}>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editingId ? 'Etkinlik Düzenle' : 'Etkinlik Oluştur'}</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, mt: 1 }}>
            <TextField
              label="Baslik"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
            <TextField
              label="Açıklama"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              multiline
              minRows={4}
              required
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
              <TextField
                select
                label="Kategori"
                value={form.categoryId}
                onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                fullWidth
                required
              >
                <MenuItem value="">Seçiniz</MenuItem>
                {categoryOptions.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {'- '.repeat(category.level)}
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Mekan"
                value={form.venueId}
                onChange={(event) => setForm((prev) => ({ ...prev, venueId: event.target.value }))}
                fullWidth
                required
              >
                <MenuItem value="">Seçiniz</MenuItem>
                {venues.map((venue) => (
                  <MenuItem key={venue.id} value={venue.id}>
                    {venue.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <TextField label="Slug" value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
            <TextField
              label="Kısa Açıklama"
              value={form.shortDescription}
              onChange={(event) => setForm((prev) => ({ ...prev, shortDescription: event.target.value }))}
              multiline
              minRows={2}
            />
            <TextField
              label="Meta Başlık"
              value={form.metaTitle}
              onChange={(event) => setForm((prev) => ({ ...prev, metaTitle: event.target.value }))}
            />
            <TextField
              label="Meta Açıklama"
              value={form.metaDescription}
              onChange={(event) => setForm((prev) => ({ ...prev, metaDescription: event.target.value }))}
              multiline
              minRows={2}
            />
            <Stack sx={{ gap: 1 }}>
              <Typography variant="subtitle2">Kapak Görseli (opsiyonel)</Typography>
              <Button variant="outlined" component="label">
                {coverFile ? `Seçildi: ${coverFile.name}` : 'Kapak Seç'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setCoverFile(file);
                    event.target.value = '';
                  }}
                />
              </Button>
            </Stack>
            <Stack sx={{ gap: 1 }}>
              <Typography variant="subtitle2">Galeri Fotoğrafları (opsiyonel)</Typography>
              <Button variant="outlined" component="label">
                Galeri Fotoğrafı Seç
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    setGalleryFiles(files);
                    event.target.value = '';
                  }}
                />
              </Button>
              {galleryFiles.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {galleryFiles.length} dosya seçildi.
                </Typography>
              )}
              {editingId && existingPhotos.length > 0 && (
                <Stack sx={{ gap: 1 }}>
                  <Typography variant="body2">Mevcut Galeri</Typography>
                  {existingPhotos.map((photo) => (
                    <Stack key={photo.id} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">
                        #{photo.sortOrder ?? '-'} - {photo.imageKey || photo.id}
                      </Typography>
                      <Button size="small" color="error" onClick={() => onDeletePhoto(photo.id)}>
                        Sil
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Stack>
            <Stack sx={{ gap: 1 }}>
              <Typography variant="subtitle2">Banner Görseli (opsiyonel)</Typography>
              <Button variant="outlined" component="label">
                {bannerFile ? `Seçildi: ${bannerFile.name}` : 'Banner Seç'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setBannerFile(file);
                    event.target.value = '';
                  }}
                />
              </Button>
              {editingId && existingBannerUrl && (
                <Typography variant="body2" color="text.secondary">
                  Bu etkinlikte aktif banner mevcut.
                </Typography>
              )}
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={form.isFeatured}
                  onChange={(event) => setForm((prev) => ({ ...prev, isFeatured: event.target.checked }))}
                />
              }
              label="Öne Çıkan"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Vazgeç</Button>
          <Button
            variant="contained"
            onClick={submitForm}
            disabled={saving || !form.title.trim() || !form.description.trim() || !form.categoryId || !form.venueId}
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={opsDialogOpen} onClose={() => setOpsDialogOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>Seans ve Bilet Tipleri - {opsEventTitle}</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
              <Button variant="contained" onClick={onCreateSession}>
                Yeni Seans
              </Button>
              {opsEventId && (
                <Button variant="outlined" onClick={() => requestCoverUpload(opsEventId)}>
                  Kapak Yükle
                </Button>
              )}
            </Stack>
            <Divider />

            {opsSessions.length === 0 && <Typography color="text.secondary">Bu etkinlik için seans bulunamadı.</Typography>}

            {opsSessions.map((session) => (
              <MainCard key={session.id} title={`Seans: ${session.startsAtUtc || '-'} -> ${session.endsAtUtc || '-'}`}>
                <Stack sx={{ gap: 2 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1 }}>
                    <Button size="small" onClick={() => onUpdateSession(session)}>
                      Seans Düzenle
                    </Button>
                    <Button size="small" color="warning" onClick={() => onCancelSession(session)}>
                      Seans İptal
                    </Button>
                    <Button size="small" color="error" onClick={() => onDeleteSession(session)}>
                      Seans Sil
                    </Button>
                    <Button size="small" variant="contained" onClick={() => onCreateTicketType(session)}>
                      Bilet Tipi Ekle
                    </Button>
                  </Stack>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Ad</TableCell>
                          <TableCell>Fiyat</TableCell>
                          <TableCell>Kapasite</TableCell>
                          <TableCell>Durum</TableCell>
                          <TableCell align="right">İşlemler</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {parseTicketTypes(session).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              Bilet tipi yok.
                            </TableCell>
                          </TableRow>
                        )}

                        {parseTicketTypes(session).map((ticketType) => (
                          <TableRow key={ticketType.id} hover>
                            <TableCell>{ticketType.name}</TableCell>
                            <TableCell>{ticketType.price ?? '-'}</TableCell>
                            <TableCell>{ticketType.capacity ?? '-'}</TableCell>
                            <TableCell>{ticketType.isActive ? 'Aktif' : 'Pasif'}</TableCell>
                            <TableCell align="right">
                              <Button size="small" onClick={() => onUpdateTicketType(session, ticketType)}>
                                Düzenle
                              </Button>
                              <Button size="small" color="error" onClick={() => onDeleteTicketType(session, ticketType)}>
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
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpsDialogOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
