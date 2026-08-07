'use client';

import { useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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
  archiveBlogPost,
  createBlogPost,
  deleteBlogPost,
  deleteBlogPostPhoto,
  getBlogPostDetail,
  publishBlogPost,
  unpublishBlogPost,
  updateBlogPost,
  uploadBlogPostPhotos
} from 'modules/blog/api/blog.service';
import useBlogPosts from 'modules/blog/hooks/useBlogPosts';
import {
  translationsToHtmlContent,
  translationsToPlainContent
} from 'modules/blog/utils/contentText';
import {
  BLOG_IMAGE,
  validateBlogImageFile
} from 'modules/blog/utils/blogImageConstraints';
import { getHumanReadableError, getProblemFieldErrors } from 'shared/api';
import {
  buildTranslationsPayload,
  createEmptyTranslations,
  getLocalizedName,
  getTaxonomySelectLabel,
  hydrateTranslations,
  trAsRoot,
  updateLocaleField
} from 'shared/i18n/contentLocales';
import TranslationLocaleTabs from 'shared/i18n/TranslationLocaleTabs';
import { clearFieldError, getFieldError, getLocaleTabFromFieldErrors, withFieldError } from 'shared/ui/fieldErrors';
import { FIELD_LIMITS, lengthFieldProps, translationsHaveLengthErrors } from 'shared/ui/fieldLength';

const MAX_PHOTOS = BLOG_IMAGE.maxCount;

const POST_FIELDS = {
  title: '',
  slug: '',
  summary: '',
  contentHtml: '',
  metaTitle: '',
  metaDescription: ''
};

const initialForm = {
  translations: createEmptyTranslations(POST_FIELDS),
  categoryId: '',
  tagIds: []
};

function field(value, fallback = '-') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return value;
}

export default function BlogPostsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [localeTab, setLocaleTab] = useState('tr');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [photoWarnings, setPhotoWarnings] = useState([]);
  const [photoPickError, setPhotoPickError] = useState('');

  const { posts, totalCount, categories, tags, isLoading, error, refresh, refreshTaxonomy } = useBlogPosts({
    page,
    pageSize: 20,
    search,
    status,
    categoryId
  });

  const pageCount = Math.max(1, Math.ceil(totalCount / 20));
  const remainingSlots = Math.max(0, MAX_PHOTOS - existingPhotos.length - pendingFiles.length);
  const hasRequiredPhoto = existingPhotos.length + pendingFiles.length >= 1;

  const pendingPreviews = useMemo(
    () =>
      pendingFiles.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file)
      })),
    [pendingFiles]
  );

  const openCreate = async () => {
    await refreshTaxonomy();
    setEditingId(null);
    setForm({
      ...initialForm,
      translations: createEmptyTranslations(POST_FIELDS),
      tagIds: []
    });
    setExistingPhotos([]);
    setPendingFiles([]);
    setPhotoWarnings([]);
    setPhotoPickError('');
    setLocaleTab('tr');
    setActionError('');
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEdit = async (postId) => {
    try {
      setActionError('');
      await refreshTaxonomy();
      const detail = await getBlogPostDetail(postId);
      const hydrated = hydrateTranslations(detail?.translations, POST_FIELDS, {
        title: detail?.title,
        slug: detail?.slug,
        summary: detail?.summary,
        contentHtml: detail?.contentHtml,
        metaTitle: detail?.metaTitle,
        metaDescription: detail?.metaDescription
      });

      setEditingId(postId);
      setForm({
        translations: translationsToPlainContent(hydrated),
        categoryId: detail?.categoryId || '',
        tagIds: Array.isArray(detail?.tagIds)
          ? detail.tagIds
          : Array.isArray(detail?.tags)
            ? detail.tags.map((tag) => tag.id)
            : []
      });
      setExistingPhotos(Array.isArray(detail?.photos) ? detail.photos : []);
      setPendingFiles([]);
      setPhotoWarnings([]);
      setPhotoPickError('');
      setLocaleTab('tr');
      setFormErrors({});
      setDialogOpen(true);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onPickPhotos = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) {
      return;
    }

    setPhotoPickError('');
    const room = Math.max(0, MAX_PHOTOS - existingPhotos.length - pendingFiles.length);
    const selected = files.slice(0, room);
    const accepted = [];
    const warnings = [];
    const rejects = [];

    for (const file of selected) {
      try {
        const result = await validateBlogImageFile(file);
        if (!result.ok) {
          rejects.push(`${file.name}: ${result.error}`);
          continue;
        }
        accepted.push(file);
        if (result.warning) {
          warnings.push(`${file.name}: ${result.warning}`);
        }
      } catch {
        rejects.push(`${file.name}: Görsel doğrulanamadı.`);
      }
    }

    if (rejects.length) {
      setPhotoPickError(rejects.join(' '));
    }
    setPhotoWarnings((prev) => [...prev, ...warnings]);
    if (accepted.length) {
      setPendingFiles((prev) => [...prev, ...accepted]);
    }
  };

  const removePendingFile = (index) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoWarnings([]);
    setFormErrors((prev) => clearFieldError(prev, 'photos'));
  };

  const onDeleteExistingPhoto = async (photoId) => {
    if (!editingId) {
      return;
    }

    if (existingPhotos.length <= 1 && pendingFiles.length === 0) {
      setActionError('En az 1 fotoğraf zorunludur; son fotoğrafı silemezsiniz.');
      return;
    }

    try {
      setActionError('');
      const updated = await deleteBlogPostPhoto(editingId, photoId);
      setExistingPhotos(Array.isArray(updated?.photos) ? updated.photos : []);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const submitForm = async () => {
    setSaving(true);
    setActionError('');
    const nextErrors = {};
    let firstErrorLocale = 'tr';

    if (!hasRequiredPhoto) {
      nextErrors.photos = 'En az 1 blog fotoğrafı zorunludur.';
    }

    const htmlTranslations = translationsToHtmlContent(form.translations);

    // Opsiyonel diller: kısmi doldurulmuşsa sessizce atma — kullanıcıya hata göster.
    for (const { code, label } of [
      { code: 'en', label: 'EN' },
      { code: 'ru', label: 'RU' }
    ]) {
      const row = htmlTranslations?.[code] || {};
      const title = String(row.title || '').trim();
      const summary = String(row.summary || '').trim();
      const contentHtml = String(row.contentHtml || '').trim();
      const slug = String(row.slug || '').trim();
      const metaTitle = String(row.metaTitle || '').trim();
      const metaDescription = String(row.metaDescription || '').trim();
      const touched = Boolean(title || summary || contentHtml || slug || metaTitle || metaDescription);

      if (!touched) {
        continue;
      }

      if (!title || !summary || !contentHtml) {
        if (!title) {
          nextErrors[`translations.${code}.title`] = `${label} çevirisinde başlık zorunludur.`;
        }

        if (!summary) {
          nextErrors[`translations.${code}.summary`] = `${label} çevirisinde özet zorunludur.`;
        }

        if (!contentHtml) {
          nextErrors[`translations.${code}.contentHtml`] = `${label} çevirisinde içerik zorunludur.`;
        }

        firstErrorLocale = code;
      }
    }

    const translations = buildTranslationsPayload(htmlTranslations, Object.keys(POST_FIELDS), 'title');

    const root = trAsRoot(htmlTranslations, {
      title: 'title',
      slug: 'slug',
      summary: 'summary',
      contentHtml: 'contentHtml',
      metaTitle: 'metaTitle',
      metaDescription: 'metaDescription'
    });

    if (!root.title || !root.summary || !root.contentHtml) {
      if (!root.title) {
        nextErrors['translations.tr.title'] = 'Başlık zorunludur.';
      }

      if (!root.summary) {
        nextErrors['translations.tr.summary'] = 'Özet zorunludur.';
      }

      if (!root.contentHtml) {
        nextErrors['translations.tr.contentHtml'] = 'İçerik zorunludur.';
      }

      firstErrorLocale = 'tr';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      setLocaleTab(firstErrorLocale);
      setSaving(false);
      return;
    }

    setFormErrors({});

    const payload = {
      ...root,
      categoryId: form.categoryId || null,
      tagIds: form.tagIds,
      translations
    };

    try {
      let postId = editingId;
      if (editingId) {
        await updateBlogPost(editingId, payload);
      } else {
        const created = await createBlogPost(payload);
        postId = created?.id;
      }

      if (postId && pendingFiles.length > 0) {
        const updated = await uploadBlogPostPhotos(postId, pendingFiles);
        setExistingPhotos(Array.isArray(updated?.photos) ? updated.photos : []);
        setPendingFiles([]);
      }

      setDialogOpen(false);
      await refresh();
    } catch (requestError) {
      const apiFieldErrors = getProblemFieldErrors(requestError?.problem, {
        photos: ['photos', 'photo', 'images'],
        'translations.tr.title': ['title'],
        'translations.tr.summary': ['summary'],
        'translations.tr.contentHtml': ['contentHtml', 'content'],
        'translations.tr.slug': ['slug'],
        'translations.tr.metaTitle': ['metaTitle'],
        'translations.tr.metaDescription': ['metaDescription'],
        categoryId: ['categoryId', 'category.id'],
        tagIds: ['tagIds', 'tags']
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

  const onPublishToggle = async (post) => {
    try {
      setActionError('');
      if (String(post.status || '').toLowerCase() === 'published') {
        await unpublishBlogPost(post.id);
      } else {
        await publishBlogPost(post.id);
      }
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onArchive = async (post) => {
    try {
      setActionError('');
      await archiveBlogPost(post.id);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onDelete = async (post) => {
    const confirmed = window.confirm(`${post.title} yazısını silmek istiyor musunuz?`);
    if (!confirmed) {
      return;
    }

    try {
      setActionError('');
      await deleteBlogPost(post.id);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  return (
    <>
      <MainCard title="Blog Yazıları">
        <Stack sx={{ gap: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2 }}>
            <TextField
              label="Ara"
              placeholder="Başlık"
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
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Tüm Durumlar</MenuItem>
              <MenuItem value="Draft">Draft</MenuItem>
              <MenuItem value="Published">Published</MenuItem>
              <MenuItem value="Archived">Archived</MenuItem>
            </TextField>
            <TextField
              select
              label="Kategori"
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">Tüm Kategoriler</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {getLocalizedName(category, 'tr') || category.name}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="contained" onClick={openCreate}>
              Yeni Yazı
            </Button>
          </Stack>

          {error && <Alert severity="error">Blog yazıları alınamadı.</Alert>}
          {actionError && <Alert severity="error">{actionError}</Alert>}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Kapak</TableCell>
                  <TableCell>Başlık</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Kategori</TableCell>
                  <TableCell>Etiketler</TableCell>
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

                {!isLoading && posts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Gösterilecek yazı bulunamadı.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  posts.map((post) => (
                    <TableRow key={post.id} hover>
                      <TableCell>
                        {post.coverImageUrl ? (
                          <Box
                            component="img"
                            src={post.coverImageUrl}
                            alt={post.title}
                            sx={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 1 }}
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{field(post.title)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={field(post.status)} />
                      </TableCell>
                      <TableCell>{field(post.categoryName)}</TableCell>
                      <TableCell>
                        {Array.isArray(post.tagSlugs)
                          ? post.tagSlugs.join(', ') || '-'
                          : Array.isArray(post.tags)
                            ? post.tags.map((tag) => tag.name).join(', ') || '-'
                            : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => openEdit(post.id)}>
                          Düzenle
                        </Button>
                        <Button size="small" onClick={() => onPublishToggle(post)}>
                          {String(post.status || '').toLowerCase() === 'published' ? 'Yayından Kaldır' : 'Yayınla'}
                        </Button>
                        <Button size="small" onClick={() => onArchive(post)}>
                          Arşivle
                        </Button>
                        <Button size="small" color="error" onClick={() => onDelete(post)}>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editingId ? 'Yazı Düzenle' : 'Yazı Oluştur'}</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, mt: 1 }}>
            {actionError ? <Alert severity="error">{actionError}</Alert> : null}
            <TranslationLocaleTabs value={localeTab} onChange={setLocaleTab}>
              {(locale) => {
                const row = form.translations?.[locale] || POST_FIELDS;
                return (
                  <Stack sx={{ gap: 2 }}>
                    <TextField
                      label="Başlık"
                      value={row.title}
                      onChange={(event) => {
                        const value = event.target.value;
                        setForm((prev) => ({
                          ...prev,
                          translations: updateLocaleField(prev.translations, locale, 'title', value, {
                            autoSlugFrom: 'title'
                          })
                        }));
                        setFormErrors((prev) => clearFieldError(prev, `translations.${locale}.title`));
                      }}
                      required={locale === 'tr'}
                      error={Boolean(getFieldError(formErrors, `translations.${locale}.title`))}
                      helperText={withFieldError(getFieldError(formErrors, `translations.${locale}.title`), lengthFieldProps(row.title, FIELD_LIMITS.blogPost.title).helperText)}
                      {...lengthFieldProps(row.title, FIELD_LIMITS.blogPost.title)}
                    />
                    <TextField
                      label="Özet"
                      value={row.summary}
                      onChange={(event) => {
                        const value = event.target.value;
                        setForm((prev) => ({
                          ...prev,
                          translations: updateLocaleField(prev.translations, locale, 'summary', value)
                        }));
                        setFormErrors((prev) => clearFieldError(prev, `translations.${locale}.summary`));
                      }}
                      multiline
                      minRows={2}
                      required={locale === 'tr'}
                      error={Boolean(getFieldError(formErrors, `translations.${locale}.summary`))}
                      helperText={withFieldError(getFieldError(formErrors, `translations.${locale}.summary`), lengthFieldProps(row.summary, FIELD_LIMITS.blogPost.summary).helperText)}
                      {...lengthFieldProps(row.summary, FIELD_LIMITS.blogPost.summary)}
                    />
                    <TextField
                      label="İçerik"
                      value={row.contentHtml}
                      onChange={(event) => {
                        const value = event.target.value;
                        setForm((prev) => ({
                          ...prev,
                          translations: updateLocaleField(prev.translations, locale, 'contentHtml', value)
                        }));
                        setFormErrors((prev) => clearFieldError(prev, `translations.${locale}.contentHtml`));
                      }}
                      multiline
                      minRows={8}
                      error={Boolean(getFieldError(formErrors, `translations.${locale}.contentHtml`))}
                      helperText={withFieldError(getFieldError(formErrors, `translations.${locale}.contentHtml`), 'Normal metin yazın. Boş satır yeni paragraf oluşturur.')}
                      required={locale === 'tr'}
                    />
                    <TextField
                      label="Slug"
                      value={row.slug}
                      onChange={
                        locale === 'tr'
                          ? (event) => {
                              const value = event.target.value;
                              setForm((prev) => ({
                                ...prev,
                                translations: updateLocaleField(prev.translations, locale, 'slug', value)
                              }));
                              setFormErrors((prev) => clearFieldError(prev, `translations.${locale}.slug`));
                            }
                          : undefined
                      }
                      slotProps={locale === 'tr' ? undefined : { input: { readOnly: true } }}
                      error={Boolean(getFieldError(formErrors, `translations.${locale}.slug`))}
                      helperText={withFieldError(
                        getFieldError(formErrors, `translations.${locale}.slug`),
                        lengthFieldProps(
                          row.slug,
                          FIELD_LIMITS.blogPost.slug,
                          locale === 'tr' ? '' : 'TR slug ile otomatik doldurulur.'
                        ).helperText
                      )}
                      {...lengthFieldProps(
                        row.slug,
                        FIELD_LIMITS.blogPost.slug,
                        locale === 'tr' ? '' : 'TR slug ile otomatik doldurulur.'
                      )}
                    />
                    <TextField
                      label="Meta Başlık"
                      value={row.metaTitle}
                      onChange={(event) => {
                        const value = event.target.value;
                        setForm((prev) => ({
                          ...prev,
                          translations: updateLocaleField(prev.translations, locale, 'metaTitle', value)
                        }));
                        setFormErrors((prev) => clearFieldError(prev, `translations.${locale}.metaTitle`));
                      }}
                      error={Boolean(getFieldError(formErrors, `translations.${locale}.metaTitle`))}
                      helperText={withFieldError(
                        getFieldError(formErrors, `translations.${locale}.metaTitle`),
                        lengthFieldProps(row.metaTitle, FIELD_LIMITS.blogPost.metaTitle).helperText
                      )}
                      {...lengthFieldProps(row.metaTitle, FIELD_LIMITS.blogPost.metaTitle)}
                    />
                    <TextField
                      label="Meta Açıklama"
                      value={row.metaDescription}
                      onChange={(event) => {
                        const value = event.target.value;
                        setForm((prev) => ({
                          ...prev,
                          translations: updateLocaleField(
                            prev.translations,
                            locale,
                            'metaDescription',
                            value
                          )
                        }));
                        setFormErrors((prev) => clearFieldError(prev, `translations.${locale}.metaDescription`));
                      }}
                      multiline
                      minRows={2}
                      error={Boolean(getFieldError(formErrors, `translations.${locale}.metaDescription`))}
                      helperText={withFieldError(
                        getFieldError(formErrors, `translations.${locale}.metaDescription`),
                        lengthFieldProps(row.metaDescription, FIELD_LIMITS.blogPost.metaDescription).helperText
                      )}
                      {...lengthFieldProps(row.metaDescription, FIELD_LIMITS.blogPost.metaDescription)}
                    />
                  </Stack>
                );
              }}
            </TranslationLocaleTabs>

            <TextField
              select
              label={`Kategori (${localeTab.toUpperCase()})`}
              value={form.categoryId}
              onChange={(event) => {
                const value = event.target.value;
                setForm((prev) => ({ ...prev, categoryId: value }));
                setFormErrors((prev) => clearFieldError(prev, 'categoryId'));
              }}
              error={Boolean(getFieldError(formErrors, 'categoryId'))}
              helperText={withFieldError(
                getFieldError(formErrors, 'categoryId'),
                categories.length === 0
                  ? 'Liste boş. Önce Blog → Blog Kategorileri menüsünden kategori ekleyin.'
                  : 'Ad, üstteki dil sekmesine göre gösterilir. Çeviri yoksa TR adı (TR) ile işaretlenir.'
              )}
            >
              <MenuItem value="">Seçiniz</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {getTaxonomySelectLabel(category, localeTab)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={`Etiketler (${localeTab.toUpperCase()})`}
              value={form.tagIds}
              onChange={(event) => {
                const value = event.target.value;
                setForm((prev) => ({ ...prev, tagIds: value }));
                setFormErrors((prev) => clearFieldError(prev, 'tagIds'));
              }}
              SelectProps={{ multiple: true }}
              error={Boolean(getFieldError(formErrors, 'tagIds'))}
              helperText={withFieldError(
                getFieldError(formErrors, 'tagIds'),
                tags.length === 0
                  ? 'Liste boş. Önce Blog → Blog Etiketleri menüsünden etiket ekleyin.'
                  : ''
              )}
            >
              {tags.map((tag) => (
                <MenuItem key={tag.id} value={tag.id}>
                  {getTaxonomySelectLabel(tag, localeTab)}
                </MenuItem>
              ))}
            </TextField>

            <Stack sx={{ gap: 1 }}>
              <Typography variant="subtitle2">
                Fotoğraflar (zorunlu, en fazla {MAX_PHOTOS})
              </Typography>
              <Alert severity="info" sx={{ py: 0.5 }}>
                Web’deki kapak/detay alanı <strong>{BLOG_IMAGE.targetWidth}×{BLOG_IMAGE.targetHeight}px</strong> (oran{' '}
                <strong>9:5</strong>). En az 1 fotoğraf yükleyin. Oran dışında dosya kabul edilmez. {BLOG_IMAGE.targetWidth}
                ×{BLOG_IMAGE.targetHeight} altındaki görseller için düşük çözünürlük uyarısı verilir.
              </Alert>
              <Typography variant="body2" color="text.secondary">
                İlk fotoğraf liste kapağıdır. Kalan slot: {remainingSlots}
              </Typography>
              <Button variant="outlined" component="label" disabled={remainingSlots <= 0}>
                Fotoğraf Ekle
                <input type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={onPickPhotos} />
              </Button>
              {photoPickError && <Alert severity="error">{photoPickError}</Alert>}
              {photoWarnings.map((warning) => (
                <Alert key={warning} severity="warning">
                  {warning}
                </Alert>
              ))}
              {getFieldError(formErrors, 'photos') && <Alert severity="error">{getFieldError(formErrors, 'photos')}</Alert>}
              {!hasRequiredPhoto && (
                <Alert severity="warning">Kaydetmek için en az 1 uygun oranlı fotoğraf ekleyin.</Alert>
              )}

              {existingPhotos.length > 0 && (
                <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                  {existingPhotos.map((photo) => (
                    <Stack key={photo.id} sx={{ gap: 0.5, alignItems: 'flex-start' }}>
                      <Box
                        component="img"
                        src={photo.imageUrl}
                        alt={photo.imageKey || photo.id}
                        sx={{
                          width: 144,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: 1,
                          border: (theme) => `1px solid ${theme.palette.divider}`
                        }}
                      />
                      <Button size="small" color="error" onClick={() => onDeleteExistingPhoto(photo.id)}>
                        Sil
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              )}

              {pendingPreviews.length > 0 && (
                <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                  {pendingPreviews.map((preview, index) => (
                    <Stack key={`${preview.name}-${index}`} sx={{ gap: 0.5, alignItems: 'flex-start' }}>
                      <Box
                        component="img"
                        src={preview.url}
                        alt={preview.name}
                        sx={{
                          width: 144,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: 1,
                          border: (theme) => `1px solid ${theme.palette.divider}`
                        }}
                      />
                      <Button size="small" onClick={() => removePendingFile(index)}>
                        Kaldır
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Vazgeç</Button>
          <Button
            variant="contained"
            onClick={submitForm}
            disabled={
              saving ||
              translationsHaveLengthErrors(form.translations, FIELD_LIMITS.blogPost)
            }
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
