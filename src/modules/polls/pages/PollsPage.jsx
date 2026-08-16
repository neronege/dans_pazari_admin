'use client';

import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
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
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import MainCard from 'components/MainCard';
import {
  createPoll,
  deletePoll,
  deletePollImage,
  getPollDetail,
  publishPoll,
  setPollHomepage,
  unpublishPoll,
  updatePoll,
  uploadPollImage
} from 'modules/polls/api/polls.service';
import usePolls from 'modules/polls/hooks/usePolls';
import { POLL_IMAGE, validatePollImageFile } from 'modules/polls/utils/pollImageConstraints';
import { getHumanReadableError, getProblemFieldErrors } from 'shared/api';
import { MediaDualPreview, MediaLightbox } from 'shared/media';
import { clearFieldError, getFieldError } from 'shared/ui/fieldErrors';

const CUSTOM_OPTION_PLACEHOLDER = 'Seçenek sunan-seçenek';

const EMPTY_OPTIONS = [
  { text: '', allowsCustomText: false },
  { text: '', allowsCustomText: false },
  { text: '', allowsCustomText: true }
];

function createEmptyOptions() {
  return EMPTY_OPTIONS.map((item) => ({ ...item }));
}

const EMPTY_FORM = {
  title: '',
  startsAtLocal: '',
  endsAtLocal: '',
  showOnHomepage: false,
  isPublished: false,
  sortOrder: 0,
  options: createEmptyOptions()
};

function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function statusLabel(item) {
  if (!item.isPublished) return { label: 'Taslak', color: 'default' };
  if (item.isOngoing) return { label: 'Devam ediyor', color: 'success' };
  if (item.isClosed) return { label: 'Sona erdi', color: 'warning' };
  return { label: 'Yayında', color: 'info' };
}

export default function PollsPage() {
  const { items, isLoading, error, refresh } = usePolls();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [optionIds, setOptionIds] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [imageWarning, setImageWarning] = useState('');
  const [imagePreview, setImagePreview] = useState({ open: false, url: '', title: '' });

  const imagePreviewUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : ''), [imageFile]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const openImagePreview = (url, title) => {
    if (!url) return;
    setImagePreview({ open: true, url, title: title || 'Anket Görseli' });
  };

  const closeImagePreview = () => {
    setImagePreview({ open: false, url: '', title: '' });
  };

  const resetImageState = () => {
    setImageFile(null);
    setExistingImageUrl('');
    setImageWarning('');
  };

  const openCreate = () => {
    setEditingId(null);
    setOptionIds([]);
    setForm({ ...EMPTY_FORM, options: createEmptyOptions() });
    setActionError('');
    setFormErrors({});
    resetImageState();
    setDialogOpen(true);
  };

  const openEdit = async (id) => {
    try {
      setActionError('');
      const detail = await getPollDetail(id);
      const options = Array.isArray(detail?.options) ? [...detail.options].sort((a, b) => a.sortOrder - b.sortOrder) : [];
      setEditingId(id);
      setOptionIds(options.map((item) => item.id));
      setForm({
        title: detail?.title || '',
        startsAtLocal: toDateTimeLocal(detail?.startsAtUtc),
        endsAtLocal: toDateTimeLocal(detail?.endsAtUtc),
        showOnHomepage: Boolean(detail?.showOnHomepage),
        isPublished: Boolean(detail?.isPublished),
        sortOrder: Number.isFinite(detail?.sortOrder) ? detail.sortOrder : 0,
        options:
          options.length >= 2
            ? options.map((item) => ({
                text: item.text || '',
                allowsCustomText: Boolean(item.allowsCustomText),
                customTexts: Array.isArray(item.customTexts) ? item.customTexts : []
              }))
            : createEmptyOptions()
      });
      setImageFile(null);
      setExistingImageUrl(detail?.imageUrl || '');
      setImageWarning('');
      setFormErrors({});
      setDialogOpen(true);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onPickImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const result = await validatePollImageFile(file);
      if (!result.ok) {
        setActionError(result.error || 'Görsel geçersiz.');
        return;
      }
      setActionError('');
      setImageWarning(result.warning || '');
      setImageFile(file);
    } catch {
      setActionError('Görsel okunamadı.');
    }
  };

  const onDeleteExistingImage = async () => {
    if (!editingId) return;
    try {
      setActionError('');
      await deletePollImage(editingId);
      setExistingImageUrl('');
      setImageFile(null);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => clearFieldError(prev, key));
  };

  const setOptionText = (index, value) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((item, i) => (i === index ? { ...item, text: value } : item))
    }));
    setFormErrors((prev) => clearFieldError(prev, 'options'));
  };

  const setOptionCustom = (index, checked) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((item, i) => ({
        ...item,
        allowsCustomText: i === index ? checked : checked ? false : item.allowsCustomText
      }))
    }));
  };

  const addOption = () => {
    if (form.options.length >= 12) return;
    setForm((prev) => ({ ...prev, options: [...prev.options, { text: '', allowsCustomText: false }] }));
    setOptionIds((prev) => [...prev, null]);
  };

  const removeOption = (index) => {
    if (form.options.length <= 2) return;
    setForm((prev) => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }));
    setOptionIds((prev) => prev.filter((_, i) => i !== index));
  };

  const validateClient = () => {
    const nextErrors = {};
    if (!String(form.title || '').trim()) nextErrors.title = 'Başlık zorunludur.';
    if (!form.startsAtLocal) nextErrors.startsAtLocal = 'Başlangıç tarihi zorunludur.';
    if (!form.endsAtLocal) nextErrors.endsAtLocal = 'Bitiş tarihi zorunludur.';

    const startsAt = toIso(form.startsAtLocal);
    const endsAt = toIso(form.endsAtLocal);
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      nextErrors.endsAtLocal = 'Bitiş tarihi başlangıçtan sonra olmalıdır.';
    }

    const filled = form.options
      .map((item) => String(item?.text || '').trim() || (item?.allowsCustomText ? CUSTOM_OPTION_PLACEHOLDER : ''))
      .filter(Boolean);
    if (filled.length < 2) nextErrors.options = 'En az iki seçenek zorunludur.';

    return nextErrors;
  };

  const submitForm = async () => {
    const nextErrors = validateClient();
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setSaving(true);
    setActionError('');
    setFormErrors({});

    const options = form.options
      .map((item, index) => {
        const allowsCustomText = Boolean(item?.allowsCustomText);
        const text = String(item?.text || '').trim() || (allowsCustomText ? CUSTOM_OPTION_PLACEHOLDER : '');
        return {
          id: optionIds[index] || undefined,
          text,
          sortOrder: index,
          allowsCustomText
        };
      })
      .filter((item) => item.text);

    const payload = {
      title: String(form.title).trim(),
      startsAtUtc: toIso(form.startsAtLocal),
      endsAtUtc: toIso(form.endsAtLocal),
      showOnHomepage: Boolean(form.showOnHomepage),
      isPublished: Boolean(form.isPublished),
      sortOrder: Number.isFinite(Number(form.sortOrder)) ? Number(form.sortOrder) : 0,
      options
    };

    try {
      if (editingId) {
        await updatePoll(editingId, payload);
        if (form.isPublished) {
          await publishPoll(editingId);
        } else {
          await unpublishPoll(editingId);
        }
        if (imageFile) {
          await uploadPollImage(editingId, imageFile);
        }
      } else {
        const created = await createPoll(payload);
        if (imageFile && created?.id) {
          await uploadPollImage(created.id, imageFile);
        }
      }
      setDialogOpen(false);
      resetImageState();
      await refresh();
    } catch (requestError) {
      const apiFieldErrors = getProblemFieldErrors(requestError?.problem, {
        title: ['title', 'Title'],
        startsAtLocal: ['startsAtUtc', 'StartsAtUtc'],
        endsAtLocal: ['endsAtUtc', 'EndsAtUtc'],
        options: ['options', 'Options']
      });
      if (Object.keys(apiFieldErrors).length > 0) {
        setFormErrors((prev) => ({ ...prev, ...apiFieldErrors }));
      }
      setActionError(
        Object.keys(apiFieldErrors).length > 0
          ? ''
          : getHumanReadableError(requestError?.problem) || requestError?.message
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleHomepage = async (item) => {
    try {
      setActionError('');
      await setPollHomepage(item.id, !item.showOnHomepage);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const togglePublish = async (item) => {
    try {
      setActionError('');
      if (item.isPublished) {
        await unpublishPoll(item.id);
      } else {
        await publishPoll(item.id);
      }
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const removeItem = async (item) => {
    if (!window.confirm(`“${item.title}” anketini silmek istiyor musunuz?`)) return;

    try {
      setActionError('');
      await deletePoll(item.id);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  return (
    <>
      <MainCard
        title="Anketler"
        secondary={
          <Button variant="contained" onClick={openCreate}>
            Anket Ekle
          </Button>
        }
      >
        <Stack sx={{ gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Başlık, tarih aralığı ve seçeneklerle anket hazırlayın. Anasayfada görünsün seçeneği açık anketler web
            anasayfasında yer alır. Üye olan ve olmayan kullanıcılar oy verebilir.
          </Typography>

          {error && <Alert severity="error">Anket listesi alınamadı.</Alert>}
          {actionError && !dialogOpen && <Alert severity="error">{actionError}</Alert>}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Başlık</TableCell>
                  <TableCell>Tarih</TableCell>
                  <TableCell>Seçenek / Oy</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Anasayfa</TableCell>
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

                {!isLoading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Henüz anket yok.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  items.map((item) => {
                    const status = statusLabel(item);
                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.title}</TableCell>
                        <TableCell>
                          {formatDate(item.startsAtUtc)}
                          <br />
                          {formatDate(item.endsAtUtc)}
                        </TableCell>
                        <TableCell>
                          {item.optionCount || 0} seçenek / {item.voteCount || 0} oy
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={status.label} color={status.color} />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={Boolean(item.showOnHomepage)}
                            onChange={() => toggleHomepage(item)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={() => openEdit(item.id)}>
                            Düzenle
                          </Button>
                          <Button size="small" onClick={() => togglePublish(item)}>
                            {item.isPublished ? 'Yayından Kaldır' : 'Yayınla'}
                          </Button>
                          <Button size="small" color="error" onClick={() => removeItem(item)}>
                            Sil
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </MainCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Anket Düzenle' : 'Anket Ekle'}</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, mt: 1 }}>
            {actionError ? <Alert severity="error">{actionError}</Alert> : null}

            <TextField
              label="Başlık"
              value={form.title}
              onChange={(event) => setField('title', event.target.value)}
              required
              fullWidth
              error={Boolean(getFieldError(formErrors, 'title'))}
              helperText={getFieldError(formErrors, 'title')}
            />

            <Stack sx={{ gap: 1 }}>
              <Typography variant="subtitle2">Anket Fotoğrafı (opsiyonel)</Typography>
              <Alert severity="info" sx={{ py: 0.5 }}>
                Web’te başlığın hemen üstünde görünür. Önerilen oran ~16:9 (ör.{' '}
                <strong>
                  {POLL_IMAGE.targetWidth}×{POLL_IMAGE.targetHeight}px
                </strong>
                ).
              </Alert>
              <Button variant="outlined" component="label">
                {imageFile ? `Seçildi: ${imageFile.name}` : 'Fotoğraf Seç'}
                <input type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onChange={onPickImage} />
              </Button>
              {imageWarning ? <Alert severity="warning">{imageWarning}</Alert> : null}
              {imagePreviewUrl ? (
                <Stack sx={{ gap: 1 }}>
                  <MediaDualPreview
                    src={imagePreviewUrl}
                    alt="Anket fotoğrafı"
                    preset="poll"
                    onOpen={openImagePreview}
                  />
                  <Button size="small" color="error" sx={{ alignSelf: 'flex-start' }} onClick={() => setImageFile(null)}>
                    Seçimi Kaldır
                  </Button>
                </Stack>
              ) : null}
              {!imagePreviewUrl && existingImageUrl ? (
                <Stack sx={{ gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Mevcut anket fotoğrafı
                  </Typography>
                  <MediaDualPreview
                    src={existingImageUrl}
                    alt="Mevcut anket fotoğrafı"
                    preset="poll"
                    onOpen={openImagePreview}
                  />
                  <Button size="small" color="error" sx={{ alignSelf: 'flex-start' }} onClick={onDeleteExistingImage}>
                    Fotoğrafı Sil
                  </Button>
                </Stack>
              ) : null}
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
              <TextField
                label="Başlangıç"
                type="datetime-local"
                value={form.startsAtLocal}
                onChange={(event) => setField('startsAtLocal', event.target.value)}
                InputLabelProps={{ shrink: true }}
                required
                fullWidth
                error={Boolean(getFieldError(formErrors, 'startsAtLocal'))}
                helperText={getFieldError(formErrors, 'startsAtLocal')}
              />
              <TextField
                label="Bitiş"
                type="datetime-local"
                value={form.endsAtLocal}
                onChange={(event) => setField('endsAtLocal', event.target.value)}
                InputLabelProps={{ shrink: true }}
                required
                fullWidth
                error={Boolean(getFieldError(formErrors, 'endsAtLocal'))}
                helperText={getFieldError(formErrors, 'endsAtLocal')}
              />
            </Stack>

            <Stack sx={{ gap: 1 }}>
              <Typography variant="subtitle2">Seçenekler</Typography>
              {getFieldError(formErrors, 'options') ? (
                <Alert severity="error">{getFieldError(formErrors, 'options')}</Alert>
              ) : null}
              {form.options.map((option, index) => (
                <Stack key={`${optionIds[index] || 'new'}-${index}`} sx={{ gap: 0.5 }}>
                  <Stack direction="row" sx={{ gap: 1 }} alignItems="center">
                    <TextField
                      label={`Seçenek ${index + 1}`}
                      placeholder={option.allowsCustomText ? CUSTOM_OPTION_PLACEHOLDER : ''}
                      value={option.text || ''}
                      onChange={(event) => setOptionText(index, event.target.value)}
                      fullWidth
                    />
                    <IconButton
                      aria-label="Seçeneği sil"
                      onClick={() => removeOption(index)}
                      disabled={form.options.length <= 2}
                    >
                      <DeleteOutlined />
                    </IconButton>
                  </Stack>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={Boolean(option.allowsCustomText)}
                        onChange={(event) => setOptionCustom(index, event.target.checked)}
                      />
                    }
                    label="Kullanıcı kendi seçeneğini yazabilsin"
                  />
                  {option.allowsCustomText && Array.isArray(option.customTexts) && option.customTexts.length > 0 ? (
                    <Alert severity="info">
                      Kullanıcı yanıtları: {option.customTexts.join(' · ')}
                    </Alert>
                  ) : null}
                </Stack>
              ))}
              <Button
                startIcon={<PlusOutlined />}
                onClick={addOption}
                disabled={form.options.length >= 12}
                sx={{ alignSelf: 'flex-start' }}
              >
                Seçenek Ekle
              </Button>
            </Stack>

            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(form.showOnHomepage)}
                  onChange={(event) => setField('showOnHomepage', event.target.checked)}
                />
              }
              label="Anasayfada görünsün"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(form.isPublished)}
                  onChange={(event) => setField('isPublished', event.target.checked)}
                />
              }
              label="Yayınla"
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

      <MediaLightbox
        open={imagePreview.open}
        url={imagePreview.url}
        title={imagePreview.title}
        onClose={closeImagePreview}
      />
    </>
  );
}
