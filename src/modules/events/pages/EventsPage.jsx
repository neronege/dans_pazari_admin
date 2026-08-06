'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
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
  setEventSortOrder,
  unpublishEvent,
  updateEvent
} from 'modules/events/api/events.service';
import useEvents from 'modules/events/hooks/useEvents';
import useSWR from 'swr';
import ArrowUpOutlined from '@ant-design/icons/ArrowUpOutlined';
import ArrowDownOutlined from '@ant-design/icons/ArrowDownOutlined';
import IconButton from '@mui/material/IconButton';
import { getHumanReadableError } from 'shared/api';
import {
  buildTranslationsPayload,
  createEmptyTranslations,
  hydrateTranslations,
  trAsRoot,
  updateLocaleField
} from 'shared/i18n/contentLocales';
import TranslationLocaleTabs from 'shared/i18n/TranslationLocaleTabs';
import { FIELD_LIMITS, isOverLimit, lengthFieldProps, translationsHaveLengthErrors } from 'shared/ui/fieldLength';

const EVENT_FIELDS = {
  title: '',
  slug: '',
  description: '',
  shortDescription: '',
  metaTitle: '',
  metaDescription: ''
};

const initialForm = {
  translations: createEmptyTranslations(EVENT_FIELDS),
  categoryId: '',
  venueId: '',
  sortOrder: 0,
  sessionId: null,
  startsAtLocal: '',
  endsAtLocal: '',
  doorOpensNote: '',
  organizerFirstName: '',
  organizerLastName: '',
  organizerAbout: '',
  videoUrl: ''
};

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

function pickPrimarySession(sessions) {
  const list = Array.isArray(sessions) ? [...sessions] : [];
  if (list.length === 0) {
    return null;
  }

  list.sort((a, b) => {
    const aTime = new Date(a.startsAtUtc || 0).getTime();
    const bTime = new Date(b.startsAtUtc || 0).getTime();
    return aTime - bTime;
  });

  return list[0];
}

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

function getEventStatusLabel(statusCode) {
  if (statusCode === 'Published') {
    return 'Yayinda';
  }

  if (statusCode === 'Cancelled') {
    return 'Iptal Edildi';
  }

  if (statusCode === 'Archived') {
    return 'Arsivlendi';
  }

  return 'Taslak';
}

function resolvePhotoUrl(photo) {
  return photo?.imageUrl || photo?.photoUrl || photo?.url || photo?.fileUrl || photo?.thumbnailUrl || '';
}

export default function EventsPage() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [localeTab, setLocaleTab] = useState('tr');
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
  const [existingCoverUrl, setExistingCoverUrl] = useState('');
  const [existingBannerUrl, setExistingBannerUrl] = useState('');
  const [imagePreview, setImagePreview] = useState({ open: false, url: '', title: '' });
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [sessionEditingId, setSessionEditingId] = useState(null);
  const [sessionForm, setSessionForm] = useState({
    startsAtLocal: '',
    endsAtLocal: '',
    doorOpensNote: ''
  });
  const [sessionSaving, setSessionSaving] = useState(false);
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const { events, isLoading, error, refresh } = useEvents({ search, city, status, categoryId });
  const { venues } = useVenues({});
  const { data: categoryTree = [] } = useSWR('admin/categories-for-events', getCategories, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });

  const categoryOptions = useMemo(() => flattenCategories(categoryTree), [categoryTree]);
  const coverPreviewUrl = useMemo(() => (coverFile ? URL.createObjectURL(coverFile) : ''), [coverFile]);
  const bannerPreviewUrl = useMemo(() => (bannerFile ? URL.createObjectURL(bannerFile) : ''), [bannerFile]);
  const galleryPreviewItems = useMemo(
    () => galleryFiles.map((file) => ({ name: file.name, previewUrl: URL.createObjectURL(file) })),
    [galleryFiles]
  );

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverPreviewUrl]);

  useEffect(() => {
    return () => {
      if (bannerPreviewUrl) {
        URL.revokeObjectURL(bannerPreviewUrl);
      }
    };
  }, [bannerPreviewUrl]);

  useEffect(() => {
    return () => {
      galleryPreviewItems.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [galleryPreviewItems]);

  const openImagePreview = (url, title) => {
    if (!url) {
      return;
    }

    setImagePreview({
      open: true,
      url,
      title: title || 'Gorsel Onizleme'
    });
  };

  const closeImagePreview = () => {
    setImagePreview({ open: false, url: '', title: '' });
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setForm({
      ...initialForm,
      translations: createEmptyTranslations(EVENT_FIELDS)
    });
    setLocaleTab('tr');
    setCoverFile(null);
    setBannerFile(null);
    setGalleryFiles([]);
    setExistingPhotos([]);
    setExistingCoverUrl('');
    setExistingBannerUrl('');
    setActionError('');
    setDialogOpen(true);
  };

  const openEditDialog = async (eventId) => {
    try {
      setActionError('');
      const detail = await getEventDetail(eventId);
      const coverUrl = detail?.coverImageUrl || '';
      const coverKey = detail?.coverImageKey || '';
      const photos = Array.isArray(detail?.photos) ? detail.photos : [];
      // Eski bug: kapak galeriye de yazılmış olabilirdi — cover ile aynı URL/key galeriden gizlenir.
      const galleryOnly = photos.filter((photo) => {
        const url = photo?.imageUrl || photo?.url || '';
        const key = photo?.imageKey || '';
        if (coverUrl && url && url === coverUrl) return false;
        if (coverKey && key && key === coverKey) return false;
        return true;
      });

      const primarySession = pickPrimarySession(detail?.sessions);
      setEditingId(eventId);
      setForm({
        translations: hydrateTranslations(detail?.translations, EVENT_FIELDS, {
          title: detail?.title || detail?.name,
          slug: detail?.slug,
          description: detail?.description,
          shortDescription: detail?.shortDescription,
          metaTitle: detail?.metaTitle,
          metaDescription: detail?.metaDescription
        }),
        categoryId: detail?.categoryId || '',
        venueId: detail?.venueId || '',
        sortOrder: Number.isFinite(detail?.sortOrder) ? detail.sortOrder : 0,
        sessionId: primarySession?.id || null,
        startsAtLocal: toDateTimeLocalFromIso(primarySession?.startsAtUtc),
        endsAtLocal: toDateTimeLocalFromIso(primarySession?.endsAtUtc),
        doorOpensNote: primarySession?.doorOpensNote || '',
        organizerFirstName: detail?.organizerFirstName || '',
        organizerLastName: detail?.organizerLastName || '',
        organizerAbout: detail?.organizerAbout || '',
        videoUrl: detail?.videoUrl || ''
      });
      setLocaleTab('tr');
      setExistingPhotos(galleryOnly);
      setExistingCoverUrl(coverUrl);
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

    const startsAtUtc = toIsoFromDateTimeLocal(form.startsAtLocal);
    const endsAtUtc = toIsoFromDateTimeLocal(form.endsAtLocal);

    if (!startsAtUtc || !endsAtUtc) {
      setActionError('Etkinlik başlangıç ve bitiş tarih/saat bilgisi zorunludur.');
      setSaving(false);
      return;
    }

    if (new Date(endsAtUtc).getTime() <= new Date(startsAtUtc).getTime()) {
      setActionError('Bitiş zamanı başlangıçtan sonra olmalıdır.');
      setSaving(false);
      return;
    }

    const translations = buildTranslationsPayload(form.translations, Object.keys(EVENT_FIELDS), 'title').filter(
      (row) => row.locale === 'tr' || Boolean(row.description)
    );
    const root = trAsRoot(form.translations, {
      title: 'title',
      slug: 'slug',
      description: 'description',
      shortDescription: 'shortDescription',
      metaTitle: 'metaTitle',
      metaDescription: 'metaDescription'
    });

    const payload = {
      ...root,
      categoryId: form.categoryId,
      venueId: form.venueId,
      sortOrder: Number.isFinite(Number(form.sortOrder)) ? Number(form.sortOrder) : 0,
      organizerFirstName: form.organizerFirstName.trim() || null,
      organizerLastName: form.organizerLastName.trim() || null,
      organizerAbout: form.organizerAbout.trim() || null,
      videoUrl: form.videoUrl.trim() || null,
      translations
    };

    const sessionPayload = {
      startsAtUtc,
      endsAtUtc,
      doorOpensNote: form.doorOpensNote.trim() || null
    };

    try {
      let targetEventId = editingId;

      if (editingId) {
        await updateEvent(editingId, payload);
        if (form.sessionId) {
          await updateEventSession(editingId, form.sessionId, sessionPayload);
        } else {
          await createEventSession(editingId, sessionPayload);
        }
      } else {
        const created = await createEvent(payload);
        targetEventId = created?.id || created?.eventId || null;
        if (!targetEventId) {
          throw new Error('Etkinlik olusturuldu ancak event id alinamadi.');
        }
        await createEventSession(targetEventId, sessionPayload);
        setEditingId(targetEventId);
      }

      await uploadSelectedMedia(targetEventId);

      setDialogOpen(false);
      setCoverFile(null);
      setBannerFile(null);
      setGalleryFiles([]);
      setExistingPhotos([]);
      setExistingCoverUrl('');
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

  const onMoveSort = async (event, direction) => {
    const index = events.findIndex((item) => item.id === event.id);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= events.length) {
      return;
    }

    const reordered = [...events];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(swapIndex, 0, moved);

    try {
      setActionError('');
      await Promise.all(reordered.map((item, order) => setEventSortOrder(item.id, order)));
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

  const openSessionDialog = (session = null) => {
    setSessionEditingId(session?.id || null);
    setSessionForm({
      startsAtLocal: toDateTimeLocalFromIso(session?.startsAtUtc),
      endsAtLocal: toDateTimeLocalFromIso(session?.endsAtUtc),
      doorOpensNote: session?.doorOpensNote || ''
    });
    setActionError('');
    setSessionDialogOpen(true);
  };

  const submitSessionDialog = async () => {
    if (!opsEventId) {
      return;
    }

    const startsAtUtc = toIsoFromDateTimeLocal(sessionForm.startsAtLocal);
    const endsAtUtc = toIsoFromDateTimeLocal(sessionForm.endsAtLocal);

    if (!startsAtUtc || !endsAtUtc) {
      setActionError('Seans başlangıç ve bitiş tarih/saat bilgisi zorunludur.');
      return;
    }

    if (new Date(endsAtUtc).getTime() <= new Date(startsAtUtc).getTime()) {
      setActionError('Bitiş zamanı başlangıçtan sonra olmalıdır.');
      return;
    }

    const payload = {
      startsAtUtc,
      endsAtUtc,
      doorOpensNote: sessionForm.doorOpensNote.trim() || null
    };

    try {
      setSessionSaving(true);
      setActionError('');
      if (sessionEditingId) {
        await updateEventSession(opsEventId, sessionEditingId, payload);
      } else {
        await createEventSession(opsEventId, payload);
      }
      setSessionDialogOpen(false);
      await reloadOperations(opsEventId);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    } finally {
      setSessionSaving(false);
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
              <MenuItem value="Draft">Taslak</MenuItem>
              <MenuItem value="Published">Yayinda</MenuItem>
              <MenuItem value="Cancelled">Iptal Edildi</MenuItem>
              <MenuItem value="Archived">Arsivlendi</MenuItem>
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
                  <TableCell width={90}>Sıra</TableCell>
                  <TableCell>Başlık</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Kategori</TableCell>
                  <TableCell>Mekan</TableCell>
                  <TableCell>Kapak</TableCell>
                  <TableCell>Banner</TableCell>
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
                  events.map((event, index) => (
                    <TableRow key={event.id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <IconButton
                            size="small"
                            disabled={index === 0}
                            onClick={() => onMoveSort(event, -1)}
                            aria-label="Yukarı taşı"
                          >
                            <ArrowUpOutlined />
                          </IconButton>
                          <IconButton
                            size="small"
                            disabled={index === events.length - 1}
                            onClick={() => onMoveSort(event, 1)}
                            aria-label="Aşağı taşı"
                          >
                            <ArrowDownOutlined />
                          </IconButton>
                          <Typography variant="body2">{event.sortOrder ?? index}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{event.title || event.name}</TableCell>
                      <TableCell>{getEventStatusLabel(normalizeEventStatus(event.status))}</TableCell>
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
                      <TableCell align="right">
                        <Button size="small" onClick={() => openEditDialog(event.id)}>
                          Düzenle
                        </Button>
                        <Button size="small" onClick={() => onPublishToggle(event)}>
                          {normalizeEventStatus(event.status) === 'Published' ? 'Yayından Kaldır' : 'Yayınla'}
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
            <TranslationLocaleTabs value={localeTab} onChange={setLocaleTab}>
              {(locale) => {
                const row = form.translations?.[locale] || EVENT_FIELDS;
                return (
                  <Stack sx={{ gap: 2 }}>
                    <TextField
                      label="Baslik"
                      value={row.title}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          translations: updateLocaleField(prev.translations, locale, 'title', event.target.value, {
                            autoSlugFrom: 'title'
                          })
                        }))
                      }
                      required={locale === 'tr'}
                      {...lengthFieldProps(row.title, FIELD_LIMITS.event.title)}
                    />
                    <TextField
                      label="Slug"
                      value={row.slug}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          translations: updateLocaleField(prev.translations, locale, 'slug', event.target.value)
                        }))
                      }
                      {...lengthFieldProps(row.slug, FIELD_LIMITS.event.slug)}
                    />
                    <TextField
                      label="Açıklama"
                      value={row.description}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          translations: updateLocaleField(prev.translations, locale, 'description', event.target.value)
                        }))
                      }
                      multiline
                      minRows={4}
                      required={locale === 'tr'}
                    />
                    <TextField
                      label="Kısa Açıklama"
                      value={row.shortDescription}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          translations: updateLocaleField(prev.translations, locale, 'shortDescription', event.target.value)
                        }))
                      }
                      multiline
                      minRows={2}
                      {...lengthFieldProps(
                        row.shortDescription,
                        FIELD_LIMITS.event.shortDescription,
                        'Liste kartlarında görünen kısa metin.'
                      )}
                    />
                    <TextField
                      label="Meta Başlık"
                      value={row.metaTitle}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          translations: updateLocaleField(prev.translations, locale, 'metaTitle', event.target.value)
                        }))
                      }
                      {...lengthFieldProps(row.metaTitle, FIELD_LIMITS.event.metaTitle)}
                    />
                    <TextField
                      label="Meta Açıklama"
                      value={row.metaDescription}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          translations: updateLocaleField(prev.translations, locale, 'metaDescription', event.target.value)
                        }))
                      }
                      multiline
                      minRows={2}
                      {...lengthFieldProps(row.metaDescription, FIELD_LIMITS.event.metaDescription)}
                    />
                  </Stack>
                );
              }}
            </TranslationLocaleTabs>
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
            <Typography variant="subtitle2">Tarih ve Saat</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
              <TextField
                label="Başlangıç"
                type="datetime-local"
                value={form.startsAtLocal}
                onChange={(event) => setForm((prev) => ({ ...prev, startsAtLocal: event.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
              <TextField
                label="Bitiş"
                type="datetime-local"
                value={form.endsAtLocal}
                onChange={(event) => setForm((prev) => ({ ...prev, endsAtLocal: event.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
            </Stack>
            <TextField
              label="Kapı açılış notu (opsiyonel)"
              value={form.doorOpensNote}
              onChange={(event) => setForm((prev) => ({ ...prev, doorOpensNote: event.target.value }))}
              helperText={
                editingId
                  ? 'Ana seans güncellenir. Ek seanslar için listeden Seanslar butonunu kullanın.'
                  : 'Yerel saat diliminize göre seçin; sunucuya UTC olarak kaydedilir.'
              }
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
              {coverPreviewUrl && (
                <Box
                  component="img"
                  src={coverPreviewUrl}
                  alt="Kapak önizleme"
                  onClick={() => openImagePreview(coverPreviewUrl, 'Kapak Onizleme')}
                  sx={{
                    width: 96,
                    height: 96,
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    cursor: 'zoom-in'
                  }}
                />
              )}
              {!coverPreviewUrl && editingId && existingCoverUrl && (
                <Stack sx={{ gap: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Bu etkinlikte aktif kapak mevcut.
                  </Typography>
                  <Box
                    component="img"
                    src={existingCoverUrl}
                    alt="Mevcut kapak"
                    onClick={() => openImagePreview(existingCoverUrl, 'Mevcut Kapak')}
                    sx={{
                      width: 96,
                      height: 96,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      cursor: 'zoom-in'
                    }}
                  />
                </Stack>
              )}
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
              {galleryPreviewItems.length > 0 && (
                <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                  {galleryPreviewItems.map((item) => (
                    <Box
                      key={item.previewUrl}
                      component="img"
                      src={item.previewUrl}
                      alt={item.name}
                      title={item.name}
                      onClick={() => openImagePreview(item.previewUrl, item.name)}
                      sx={{
                        width: 72,
                        height: 72,
                        objectFit: 'cover',
                        borderRadius: 1,
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        cursor: 'zoom-in'
                      }}
                    />
                  ))}
                </Stack>
              )}
              {editingId && existingPhotos.length > 0 && (
                <Stack sx={{ gap: 1 }}>
                  <Typography variant="body2">Mevcut Galeri</Typography>
                  {existingPhotos.map((photo) => {
                    const photoUrl = resolvePhotoUrl(photo);

                    return (
                      <Stack key={photo.id} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
                          {photoUrl ? (
                            <Box
                              component="img"
                              src={photoUrl}
                              alt={photo.imageKey || `Foto ${photo.id}`}
                              onClick={() => openImagePreview(photoUrl, photo.imageKey || `Foto ${photo.id}`)}
                              sx={{
                                width: 56,
                                height: 56,
                                objectFit: 'cover',
                                borderRadius: 1,
                                border: (theme) => `1px solid ${theme.palette.divider}`,
                                cursor: 'zoom-in'
                              }}
                            />
                          ) : null}
                          <Typography variant="body2">
                            #{photo.sortOrder ?? '-'} - {photo.imageKey || photo.id}
                          </Typography>
                        </Stack>
                        <Button size="small" color="error" onClick={() => onDeletePhoto(photo.id)}>
                          Sil
                        </Button>
                      </Stack>
                    );
                  })}
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
              {bannerPreviewUrl && (
                <Box
                  component="img"
                  src={bannerPreviewUrl}
                  alt="Banner önizleme"
                  onClick={() => openImagePreview(bannerPreviewUrl, 'Banner Onizleme')}
                  sx={{
                    width: 140,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    cursor: 'zoom-in'
                  }}
                />
              )}
              {editingId && existingBannerUrl && (
                <Stack sx={{ gap: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Bu etkinlikte aktif banner mevcut.
                  </Typography>
                  <Box
                    component="img"
                    src={existingBannerUrl}
                    alt="Mevcut banner"
                    onClick={() => openImagePreview(existingBannerUrl, 'Mevcut Banner')}
                    sx={{
                      width: 140,
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      cursor: 'zoom-in'
                    }}
                  />
                </Stack>
              )}
            </Stack>
            <TextField
              label="Sıra"
              type="number"
              value={form.sortOrder}
              onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))}
              helperText="Küçük numara listede önce görünür."
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Video URL (opsiyonel)"
              value={form.videoUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, videoUrl: event.target.value }))}
              {...lengthFieldProps(
                form.videoUrl,
                FIELD_LIMITS.event.videoUrl,
                'YouTube, Vimeo veya doğrudan https video linki.'
              )}
              fullWidth
            />
            <Typography variant="subtitle2">Düzenleyen Kişi (opsiyonel)</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
              <TextField
                label="Ad"
                value={form.organizerFirstName}
                onChange={(event) => setForm((prev) => ({ ...prev, organizerFirstName: event.target.value }))}
                fullWidth
                {...lengthFieldProps(form.organizerFirstName, FIELD_LIMITS.event.organizerFirstName)}
              />
              <TextField
                label="Soyad"
                value={form.organizerLastName}
                onChange={(event) => setForm((prev) => ({ ...prev, organizerLastName: event.target.value }))}
                fullWidth
                {...lengthFieldProps(form.organizerLastName, FIELD_LIMITS.event.organizerLastName)}
              />
            </Stack>
            <TextField
              label="Hakkında"
              value={form.organizerAbout}
              onChange={(event) => setForm((prev) => ({ ...prev, organizerAbout: event.target.value }))}
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Vazgeç</Button>
          <Button
            variant="contained"
            onClick={submitForm}
            disabled={
              saving ||
              !String(form.translations?.tr?.title || '').trim() ||
              !String(form.translations?.tr?.description || '').trim() ||
              !form.categoryId ||
              !form.venueId ||
              translationsHaveLengthErrors(form.translations, {
                title: FIELD_LIMITS.event.title,
                slug: FIELD_LIMITS.event.slug,
                shortDescription: FIELD_LIMITS.event.shortDescription,
                metaTitle: FIELD_LIMITS.event.metaTitle,
                metaDescription: FIELD_LIMITS.event.metaDescription
              }) ||
              isOverLimit(form.videoUrl, FIELD_LIMITS.event.videoUrl) ||
              isOverLimit(form.organizerFirstName, FIELD_LIMITS.event.organizerFirstName) ||
              isOverLimit(form.organizerLastName, FIELD_LIMITS.event.organizerLastName)
            }
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={imagePreview.open} onClose={closeImagePreview} fullWidth maxWidth="md">
        <DialogTitle>{imagePreview.title || 'Gorsel Onizleme'}</DialogTitle>
        <DialogContent>
          {imagePreview.url ? (
            <Box
              component="img"
              src={imagePreview.url}
              alt={imagePreview.title || 'Gorsel Onizleme'}
              sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 1 }}
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeImagePreview}>Kapat</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={opsDialogOpen} onClose={() => setOpsDialogOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>Seans ve Bilet Tipleri - {opsEventTitle}</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
              <Button variant="contained" onClick={() => openSessionDialog()}>
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
                    <Button size="small" onClick={() => openSessionDialog(session)}>
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

      <Dialog open={sessionDialogOpen} onClose={() => setSessionDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{sessionEditingId ? 'Seans Düzenle' : 'Yeni Seans'}</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, mt: 1 }}>
            <TextField
              label="Başlangıç"
              type="datetime-local"
              value={sessionForm.startsAtLocal}
              onChange={(event) => setSessionForm((prev) => ({ ...prev, startsAtLocal: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
            <TextField
              label="Bitiş"
              type="datetime-local"
              value={sessionForm.endsAtLocal}
              onChange={(event) => setSessionForm((prev) => ({ ...prev, endsAtLocal: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
            <TextField
              label="Kapı açılış notu (opsiyonel)"
              value={sessionForm.doorOpensNote}
              onChange={(event) => setSessionForm((prev) => ({ ...prev, doorOpensNote: event.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionDialogOpen(false)} disabled={sessionSaving}>
            İptal
          </Button>
          <Button variant="contained" onClick={submitSessionDialog} disabled={sessionSaving}>
            {sessionSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
