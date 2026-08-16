'use client';

import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
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
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MainCard from 'components/MainCard';
import useVenues from 'modules/venues/hooks/useVenues';
import {
  addVenuePhotos,
  createVenue,
  deleteVenue,
  deleteVenuePhoto,
  deleteVenueVideo,
  getVenueDetail,
  updateVenue,
  updateVenueActive,
  uploadVenueVideo
} from 'modules/venues/api/venues.service';
import { validateVenueImageFile, VENUE_IMAGE } from 'modules/venues/utils/venueImageConstraints';
import useVenueGoogleMap from 'modules/venues/hooks/useVenueGoogleMap';
import { getHumanReadableError, getProblemFieldErrors } from 'shared/api';
import { MediaDualPreview, MediaLightbox } from 'shared/media';
import {
  buildTranslationsPayload,
  createEmptyTranslations,
  hydrateTranslations,
  trAsRoot,
  updateLocaleField
} from 'shared/i18n/contentLocales';
import TranslationLocaleTabs from 'shared/i18n/TranslationLocaleTabs';
import { clearFieldError, getFieldError, getLocaleTabFromFieldErrors, withFieldError } from 'shared/ui/fieldErrors';
import { FIELD_LIMITS, lengthFieldProps, translationsHaveLengthErrors, isOverLimit } from 'shared/ui/fieldLength';

const VENUE_FIELDS = { name: '', slug: '', description: '' };
const VENUE_MAP_ID = 'fbaac9edab0fe380d93c3919';

const initialForm = {
  translations: createEmptyTranslations(VENUE_FIELDS),
  address: '',
  district: '',
  city: '',
  latitude: '',
  longitude: '',
  capacity: '',
  isActive: true,
  videoUrl: ''
};

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_FILE_COUNT = 1;
const MAX_TOTAL_REQUEST_BYTES = 20 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function VenuesPage() {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [localeTab, setLocaleTab] = useState('tr');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [photoWarnings, setPhotoWarnings] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [imagePreview, setImagePreview] = useState({ open: false, url: '', title: '' });

  const selectedPhotoPreviews = useMemo(
    () => selectedPhotos.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    [selectedPhotos]
  );

  useEffect(() => {
    return () => {
      selectedPhotoPreviews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [selectedPhotoPreviews]);

  const openImagePreview = (url, title) => {
    if (!url) return;
    setImagePreview({ open: true, url, title: title || 'Görsel Önizleme' });
  };

  const closeImagePreview = () => {
    setImagePreview({ open: false, url: '', title: '' });
  };

  const { mapContainerRef, addressInputRef, mapError, searchByAddress } = useVenueGoogleMap({
    enabled: dialogOpen,
    apiKey: googleMapsApiKey,
    latitude: form.latitude,
    longitude: form.longitude,
    mapId: VENUE_MAP_ID,
    onLocationChange: ({ latitude, longitude, city: nextCity, district: nextDistrict, address: nextAddress }) => {
      setForm((prev) => ({
        ...prev,
        latitude: latitude ?? prev.latitude,
        longitude: longitude ?? prev.longitude,
        city: nextCity || prev.city,
        district: nextDistrict || prev.district,
        address: nextAddress || prev.address
      }));
    }
  });

  const { venues, isLoading, error, refresh } = useVenues({ city, search });
  const openCreateDialog = () => {
    setEditingId(null);
    setForm({
      ...initialForm,
      translations: createEmptyTranslations(VENUE_FIELDS)
    });
    setLocaleTab('tr');
    setSelectedPhotos([]);
    setExistingPhotos([]);
    setVideoFile(null);
    setActionError('');
    setPhotoWarnings([]);
    setFormErrors({});
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setDialogOpen(true);
  };

  const openEditDialog = async (venueId) => {
    try {
      setActionError('');
      const detail = await getVenueDetail(venueId);

      setEditingId(venueId);
      setForm({
        translations: hydrateTranslations(detail?.translations, VENUE_FIELDS, {
          name: detail?.name,
          slug: detail?.slug,
          description: detail?.description
        }),
        address: detail?.address || '',
        district: detail?.district || '',
        city: detail?.city || '',
        latitude: detail?.latitude ?? '',
        longitude: detail?.longitude ?? '',
        capacity: detail?.capacity ?? '',
        isActive: detail?.isActive ?? true,
        videoUrl: detail?.videoUrl || ''
      });
      setLocaleTab('tr');
      setSelectedPhotos([]);
      setExistingPhotos(Array.isArray(detail?.photos) ? detail.photos : []);
      setVideoFile(null);
      setPhotoWarnings([]);
      setFormErrors({});
      if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setDialogOpen(true);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const validateAndSetPhotos = async (files) => {
    const nextFiles = Array.from(files || []).slice(0, MAX_FILE_COUNT);
    const totalCount = nextFiles.length + existingPhotos.length;
    const totalBytes = nextFiles.reduce((sum, file) => sum + Number(file?.size || 0), 0);

    if (totalCount > MAX_FILE_COUNT) {
      setActionError('Mekana yalnızca 1 fotoğraf ekleyebilirsiniz.');
      return;
    }

    if (totalBytes > MAX_TOTAL_REQUEST_BYTES) {
      setActionError('Seçilen dosyaların toplamı en fazla 20 MB olabilir.');
      return;
    }

    for (const file of nextFiles) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setActionError('Sadece jpeg, png, webp veya gif dosyaları yüklenebilir.');
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setActionError('Her bir fotoğraf en fazla 8 MB olabilir.');
        return;
      }
    }

    const accepted = [];
    const warnings = [];
    const rejects = [];

    for (const file of nextFiles) {
      try {
        const result = await validateVenueImageFile(file);
        if (!result.ok) {
          rejects.push(`${file.name}: ${result.error}`);
          continue;
        }

        accepted.push(file);
        if (result.warning) {
          warnings.push(`${file.name}: ${result.warning}`);
        }
      } catch {
        rejects.push(`${file.name}: Gorsel dogrulanamadi.`);
      }
    }

    if (!accepted.length) {
      setActionError(rejects.join(' '));
      setPhotoWarnings([]);
      return;
    }

    setActionError(rejects.join(' '));
    setPhotoWarnings(warnings);
    setSelectedPhotos(accepted);
  };

  const removeSelectedPhoto = (index) => {
    setSelectedPhotos((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
    setPhotoWarnings([]);
  };

  const removeExistingPhoto = async (photoId) => {
    if (!editingId) {
      return;
    }

    try {
      setActionError('');
      await deleteVenuePhoto(editingId, photoId);
      setExistingPhotos((prev) => prev.filter((item) => item.id !== photoId));
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const closeDialog = () => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setDialogOpen(false);
  };

  const submitForm = async () => {
    setSaving(true);
    setActionError('');

    const sharedAddress = String(form.address || '').trim();
    const sharedDistrict = String(form.district || '').trim() || null;
    const nextErrors = {};

    if (!String(form.translations?.tr?.name || '').trim()) {
      nextErrors['translations.tr.name'] = 'Ad zorunludur.';
    }

    if (!sharedAddress) {
      nextErrors.address = 'Adres zorunludur.';
    }

    if (!String(form.city || '').trim()) {
      nextErrors.city = 'Şehir zorunludur.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      setLocaleTab('tr');
      setSaving(false);
      return;
    }

    setFormErrors({});

    // Adres/ilçe dile bağlı değil — tüm locale satırlarına aynı değer yazılır.
    const translations = buildTranslationsPayload(
      form.translations,
      Object.keys(VENUE_FIELDS),
      'name'
    ).map((row) => ({
      ...row,
      address: sharedAddress,
      district: sharedDistrict
    }));

    const root = trAsRoot(form.translations, {
      name: 'name',
      slug: 'slug',
      description: 'description'
    });

    const payload = {
      ...root,
      address: sharedAddress,
      district: sharedDistrict,
      city: form.city,
      latitude: form.latitude === '' ? null : Number(form.latitude),
      longitude: form.longitude === '' ? null : Number(form.longitude),
      capacity: form.capacity === '' ? null : Number(form.capacity),
      isActive: Boolean(form.isActive),
      videoUrl: form.videoUrl.trim() || null,
      translations
    };

    try {
      let targetVenueId = editingId;
      if (editingId) {
        await updateVenue(editingId, payload, selectedPhotos);
      } else {
        const created = await createVenue(payload, selectedPhotos);
        targetVenueId = created?.id || null;
      }

      if (videoFile && targetVenueId) {
        await uploadVenueVideo(targetVenueId, videoFile);
      }

      closeDialog();
      setSelectedPhotos([]);
      setExistingPhotos([]);
      setVideoFile(null);
      await refresh();
    } catch (requestError) {
      const apiFieldErrors = getProblemFieldErrors(requestError?.problem, {
        'translations.tr.name': ['name'],
        address: ['address'],
        district: ['district'],
        city: ['city'],
        capacity: ['capacity'],
        videoUrl: ['videoUrl']
      });

      if (Object.keys(apiFieldErrors).length > 0) {
        setFormErrors((prev) => ({ ...prev, ...apiFieldErrors }));
        const nextLocale = getLocaleTabFromFieldErrors(apiFieldErrors);
        if (nextLocale) {
          setLocaleTab(nextLocale);
        }
      }

      setActionError(Object.keys(apiFieldErrors).length > 0 ? '' : getHumanReadableError(requestError?.problem) || requestError?.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadExtraPhotos = async () => {
    if (!editingId || selectedPhotos.length === 0) {
      return;
    }

    try {
      setActionError('');
      await addVenuePhotos(editingId, selectedPhotos);
      const detail = await getVenueDetail(editingId);
      setExistingPhotos(Array.isArray(detail?.photos) ? detail.photos : []);
      setSelectedPhotos([]);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
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

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        disableRestoreFocus
      >
        <DialogTitle>{editingId ? 'Mekan Düzenle' : 'Mekan Oluştur'}</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, mt: 1 }}>
            <TranslationLocaleTabs value={localeTab} onChange={setLocaleTab}>
              {(locale) => {
                const row = form.translations?.[locale] || VENUE_FIELDS;
                return (
                  <Stack sx={{ gap: 2 }}>
                    <TextField
                      label="Ad"
                      value={row.name}
                      onChange={(event) => {
                        const value = event.target.value;
                        setForm((prev) => ({
                          ...prev,
                          translations: updateLocaleField(prev.translations, locale, 'name', value, {
                            autoSlugFrom: 'name'
                          })
                        }));
                        setFormErrors((prev) => clearFieldError(prev, `translations.${locale}.name`));
                      }}
                      required={locale === 'tr'}
                      error={Boolean(getFieldError(formErrors, `translations.${locale}.name`))}
                      helperText={withFieldError(getFieldError(formErrors, `translations.${locale}.name`), lengthFieldProps(row.name, FIELD_LIMITS.venue.name).helperText)}
                      {...lengthFieldProps(row.name, FIELD_LIMITS.venue.name)}
                    />
                    <TextField
                      label="Slug"
                      value={row.slug}
                      slotProps={{ input: { readOnly: true } }}
                      {...lengthFieldProps(
                        row.slug,
                        FIELD_LIMITS.venue.slug,
                        locale === 'tr' ? '' : 'TR slug ile otomatik doldurulur.'
                      )}
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
                      minRows={3}
                    />
                  </Stack>
                );
              }}
            </TranslationLocaleTabs>
            <TextField
              label="Adres"
              value={form.address}
              inputRef={addressInputRef}
              onChange={(event) => {
                const value = event.target.value;
                setForm((prev) => ({ ...prev, address: value }));
                setFormErrors((prev) => clearFieldError(prev, 'address'));
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  searchByAddress(form.address);
                }
              }}
              required
              error={Boolean(getFieldError(formErrors, 'address'))}
              helperText={withFieldError(
                getFieldError(formErrors, 'address'),
                'Adres yazıp Enter / Haritada bul, veya öneriden seçin. Tüm dillerde aynı kullanılır.'
              )}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button size="small" onClick={() => searchByAddress(form.address)} sx={{ whiteSpace: 'nowrap' }}>
                        Haritada bul
                      </Button>
                    </InputAdornment>
                  )
                }
              }}
            />
            <TextField
              label="İlçe"
              value={form.district}
              slotProps={{ input: { readOnly: true } }}
              {...lengthFieldProps(form.district, FIELD_LIMITS.venue.district)}
              helperText="Haritadan konum seçildiğinde otomatik dolar."
            />
            <TextField
              label="Şehir"
              value={form.city}
              required
              slotProps={{ input: { readOnly: true } }}
              {...lengthFieldProps(form.city, FIELD_LIMITS.venue.city)}
              error={Boolean(getFieldError(formErrors, 'city'))}
              helperText={withFieldError(
                getFieldError(formErrors, 'city'),
                'Haritadan konum seçildiğinde otomatik dolar.'
              )}
            />
            <Stack sx={{ gap: 1 }}>
              <Box
                ref={mapContainerRef}
                sx={{ width: '100%', height: 280, borderRadius: 1, border: (theme) => `1px solid ${theme.palette.divider}` }}
              />
              <Alert severity="info">
                Adres yazarak arayın veya haritaya tıklayın. Şehir ve ilçe otomatik doldurulur.
              </Alert>
              {mapError && <Alert severity="warning">{mapError}</Alert>}
            </Stack>
            <Stack sx={{ gap: 1 }}>
              <Typography variant="subtitle2">Fotoğraflar</Typography>
              <Alert severity="info" sx={{ py: 0.5 }}>
                Minimum mock olcu <strong>{VENUE_IMAGE.targetWidth}x{VENUE_IMAGE.targetHeight}px</strong> ve oran ~
                <strong>3:2</strong>. Daha yuksek cozunurlukte, oran uyumlu gorseller kabul edilir.
              </Alert>
              <Button variant="outlined" component="label">
                Fotoğraf Seç
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => {
                    void validateAndSetPhotos(event.target.files);
                    event.target.value = '';
                  }}
                />
              </Button>
              {photoWarnings.map((warning) => (
                <Alert key={warning} severity="warning">
                  {warning}
                </Alert>
              ))}

              {selectedPhotos.length > 0 && (
                <Stack sx={{ gap: 2 }}>
                  {selectedPhotoPreviews.map((item, index) => (
                    <Stack key={item.url} sx={{ gap: 1 }}>
                      <MediaDualPreview
                        src={item.url}
                        alt={item.name}
                        preset="venue"
                        onOpen={openImagePreview}
                      />
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">{item.name}</Typography>
                        <Button size="small" color="error" onClick={() => removeSelectedPhoto(index)}>
                          Kaldır
                        </Button>
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              )}

              {editingId && existingPhotos.length > 0 && (
                <Stack sx={{ gap: 2 }}>
                  <Typography variant="body2">Mevcut Fotoğraflar</Typography>
                  {existingPhotos.map((photo) => {
                    const photoUrl = photo.imageUrl || photo.url || '';
                    return (
                      <Stack key={photo.id} sx={{ gap: 1 }}>
                        {photoUrl ? (
                          <MediaDualPreview
                            src={photoUrl}
                            alt={photo.imageKey || photo.id}
                            preset="venue"
                            onOpen={openImagePreview}
                          />
                        ) : null}
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">
                            #{photo.sortOrder ?? '-'} - {photo.imageKey || photo.id}
                          </Typography>
                          <Button size="small" color="error" onClick={() => removeExistingPhoto(photo.id)}>
                            Sil
                          </Button>
                        </Stack>
                      </Stack>
                    );
                  })}
                </Stack>
              )}

              {editingId && selectedPhotos.length > 0 && (
                <Button variant="outlined" onClick={uploadExtraPhotos}>
                  Seçilen Fotoğrafı Ekle
                </Button>
              )}
            </Stack>
            <TextField
              type="number"
              label="Kapasite"
              value={form.capacity}
              onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
            />
            <Stack sx={{ gap: 1 }}>
              <TextField
                label="Video URL (opsiyonel)"
                value={form.videoUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, videoUrl: event.target.value }))}
                {...lengthFieldProps(
                  form.videoUrl,
                  FIELD_LIMITS.venue.videoUrl,
                  'YouTube, Vimeo veya doğrudan https video linki. Dosya yüklerseniz bu alan otomatik dolar.'
                )}
                fullWidth
              />
              <Alert severity="info" sx={{ py: 0.5 }}>
                Alternatif: <strong>mp4 / webm / mov</strong> yükleyin (en fazla 80 MB). Web’de aynı oynatıcı kullanılır.
              </Alert>
              <Button variant="outlined" component="label">
                {videoFile ? `Seçildi: ${videoFile.name}` : 'Video Dosyası Seç'}
                <input
                  type="file"
                  hidden
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    event.target.value = '';
                    setVideoFile(file);
                    if (file) {
                      setForm((prev) => ({ ...prev, videoUrl: '' }));
                    }
                  }}
                />
              </Button>
              {videoFile ? (
                <Button size="small" color="error" sx={{ alignSelf: 'flex-start' }} onClick={() => setVideoFile(null)}>
                  Dosya seçimini kaldır
                </Button>
              ) : null}
              {editingId && form.videoUrl && !videoFile ? (
                <Button
                  size="small"
                  color="error"
                  sx={{ alignSelf: 'flex-start' }}
                  onClick={async () => {
                    try {
                      setActionError('');
                      const updated = await deleteVenueVideo(editingId);
                      setForm((prev) => ({ ...prev, videoUrl: updated?.videoUrl || '' }));
                    } catch (requestError) {
                      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
                    }
                  }}
                >
                  Videoyu Sil
                </Button>
              ) : null}
            </Stack>
            <FormControlLabel
              control={
                <Switch checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />
              }
              label="Aktif"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Vazgeç</Button>
          <Button
            variant="contained"
            onClick={submitForm}
            disabled={
              saving ||
              translationsHaveLengthErrors(form.translations, {
                name: FIELD_LIMITS.venue.name,
                slug: FIELD_LIMITS.venue.slug
              }) ||
              isOverLimit(form.city, FIELD_LIMITS.venue.city) ||
              isOverLimit(form.district, FIELD_LIMITS.venue.district) ||
              isOverLimit(form.videoUrl, FIELD_LIMITS.venue.videoUrl)
            }
          >
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
