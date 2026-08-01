'use client';

import { useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
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
import MainCard from 'components/MainCard';
import {
  archiveBlogPost,
  createBlogPost,
  deleteBlogPost,
  deleteBlogPostCover,
  getBlogPostDetail,
  publishBlogPost,
  unpublishBlogPost,
  updateBlogPost,
  uploadBlogPostCover
} from 'modules/blog/api/blog.service';
import useBlogPosts from 'modules/blog/hooks/useBlogPosts';
import { getHumanReadableError } from 'shared/api';
import {
  buildTranslationsPayload,
  createEmptyTranslations,
  hydrateTranslations,
  trAsRoot,
  updateLocaleField
} from 'shared/i18n/contentLocales';
import TranslationLocaleTabs from 'shared/i18n/TranslationLocaleTabs';

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
  const [coverTargetPostId, setCoverTargetPostId] = useState(null);
  const fileInputRef = useRef(null);

  const { posts, totalCount, categories, tags, isLoading, error, refresh } = useBlogPosts({
    page,
    pageSize: 20,
    search,
    status,
    categoryId
  });

  const pageCount = Math.max(1, Math.ceil(totalCount / 20));

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...initialForm,
      translations: createEmptyTranslations(POST_FIELDS),
      tagIds: []
    });
    setLocaleTab('tr');
    setActionError('');
    setDialogOpen(true);
  };

  const openEdit = async (postId) => {
    try {
      setActionError('');
      const detail = await getBlogPostDetail(postId);
      setEditingId(postId);
      setForm({
        translations: hydrateTranslations(detail?.translations, POST_FIELDS, {
          title: detail?.title,
          slug: detail?.slug,
          summary: detail?.summary,
          contentHtml: detail?.contentHtml,
          metaTitle: detail?.metaTitle,
          metaDescription: detail?.metaDescription
        }),
        categoryId: detail?.categoryId || '',
        tagIds: Array.isArray(detail?.tagIds) ? detail.tagIds : Array.isArray(detail?.tags) ? detail.tags.map((tag) => tag.id) : []
      });
      setLocaleTab('tr');
      setDialogOpen(true);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const submitForm = async () => {
    setSaving(true);
    setActionError('');

    const translations = buildTranslationsPayload(form.translations, Object.keys(POST_FIELDS), 'title').filter((row) => {
      if (row.locale === 'tr') {
        return true;
      }
      // Opsiyonel dil: başlık + özet + içerik dolu olmalı
      return Boolean(row.summary && row.contentHtml);
    });

    const root = trAsRoot(form.translations, {
      title: 'title',
      slug: 'slug',
      summary: 'summary',
      contentHtml: 'contentHtml',
      metaTitle: 'metaTitle',
      metaDescription: 'metaDescription'
    });

    const payload = {
      ...root,
      categoryId: form.categoryId || null,
      tagIds: form.tagIds,
      translations
    };

    try {
      if (editingId) {
        await updateBlogPost(editingId, payload);
      } else {
        await createBlogPost(payload);
      }
      setDialogOpen(false);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
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

  const requestCoverUpload = (postId) => {
    setCoverTargetPostId(postId);
    fileInputRef.current?.click();
  };

  const onCoverFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !coverTargetPostId) {
      return;
    }

    try {
      setActionError('');
      await uploadBlogPostCover(coverTargetPostId, file);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    } finally {
      event.target.value = '';
      setCoverTargetPostId(null);
    }
  };

  const onDeleteCover = async (post) => {
    try {
      setActionError('');
      await deleteBlogPostCover(post.id);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onCoverFileChange} />

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
                  {category.name}
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
                    <TableCell colSpan={5} align="center">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && posts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Gösterilecek yazı bulunamadı.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  posts.map((post) => (
                    <TableRow key={post.id} hover>
                      <TableCell>{field(post.title)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={field(post.status)} />
                      </TableCell>
                      <TableCell>{field(post.categoryName)}</TableCell>
                      <TableCell>{Array.isArray(post.tags) ? post.tags.map((tag) => tag.name).join(', ') || '-' : '-'}</TableCell>
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
                        <Button size="small" onClick={() => requestCoverUpload(post.id)}>
                          Kapak Yükle
                        </Button>
                        <Button size="small" onClick={() => onDeleteCover(post)}>
                          Kapak Sil
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
            <TranslationLocaleTabs value={localeTab} onChange={setLocaleTab}>
              {(locale) => {
                const row = form.translations?.[locale] || POST_FIELDS;
                return (
                  <Stack sx={{ gap: 2 }}>
                    <TextField
                      label="Başlık"
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
                    />
                    <TextField
                      label="Özet"
                      value={row.summary}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          translations: updateLocaleField(prev.translations, locale, 'summary', event.target.value)
                        }))
                      }
                      multiline
                      minRows={2}
                      required={locale === 'tr'}
                    />
                    <TextField
                      label="İçerik (HTML)"
                      value={row.contentHtml}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          translations: updateLocaleField(prev.translations, locale, 'contentHtml', event.target.value)
                        }))
                      }
                      multiline
                      minRows={6}
                      required={locale === 'tr'}
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
                    />
                  </Stack>
                );
              }}
            </TranslationLocaleTabs>
            <TextField
              select
              label="Kategori"
              value={form.categoryId}
              onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
            >
              <MenuItem value="">Seçiniz</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Etiketler"
              value={form.tagIds}
              onChange={(event) => setForm((prev) => ({ ...prev, tagIds: event.target.value }))}
              SelectProps={{ multiple: true }}
            >
              {tags.map((tag) => (
                <MenuItem key={tag.id} value={tag.id}>
                  {tag.name}
                </MenuItem>
              ))}
            </TextField>
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
              !String(form.translations?.tr?.summary || '').trim() ||
              !String(form.translations?.tr?.contentHtml || '').trim()
            }
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
