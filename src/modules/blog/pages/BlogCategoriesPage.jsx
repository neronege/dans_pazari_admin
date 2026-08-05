'use client';

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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
import Typography from '@mui/material/Typography';
import MainCard from 'components/MainCard';
import {
  createBlogCategory,
  deleteBlogCategory,
  updateBlogCategory
} from 'modules/blog/api/blog.service';
import useBlogCategories from 'modules/blog/hooks/useBlogCategories';
import { getHumanReadableError } from 'shared/api';
import {
  buildTranslationsPayload,
  createEmptyTranslations,
  getLocalizedName,
  getTranslationRow,
  hydrateTranslations,
  trAsRoot,
  updateLocaleField
} from 'shared/i18n/contentLocales';
import TranslationLocaleTabs from 'shared/i18n/TranslationLocaleTabs';

const CATEGORY_FIELDS = { name: '', slug: '', description: '' };

export default function BlogCategoriesPage() {
  const { categories, isLoading, error, refresh } = useBlogCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [translations, setTranslations] = useState(createEmptyTranslations(CATEGORY_FIELDS));
  const [isActive, setIsActive] = useState(true);
  const [localeTab, setLocaleTab] = useState('tr');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const openCreate = () => {
    setEditingId(null);
    setTranslations(createEmptyTranslations(CATEGORY_FIELDS));
    setIsActive(true);
    setLocaleTab('tr');
    setActionError('');
    setDialogOpen(true);
  };

  const openEdit = (category) => {
    setEditingId(category.id);
    setTranslations(
      hydrateTranslations(category?.translations, CATEGORY_FIELDS, {
        name: category?.name,
        slug: category?.slug,
        description: category?.description
      })
    );
    setIsActive(category?.isActive ?? true);
    setLocaleTab('tr');
    setActionError('');
    setDialogOpen(true);
  };

  const submitForm = async () => {
    setSaving(true);
    setActionError('');

    const payloadTranslations = buildTranslationsPayload(translations, Object.keys(CATEGORY_FIELDS), 'name');
    const root = trAsRoot(translations, { name: 'name', slug: 'slug', description: 'description' });

    if (!String(root.name || '').trim()) {
      setActionError('Kategori adı zorunludur.');
      setSaving(false);
      return;
    }

    const payload = {
      ...root,
      isActive,
      translations: payloadTranslations
    };

    try {
      if (editingId) {
        await updateBlogCategory(editingId, payload);
      } else {
        await createBlogCategory(payload);
      }
      setDialogOpen(false);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (category) => {
    const confirmed = window.confirm(`“${category.name}” blog kategorisini silmek istiyor musunuz?`);
    if (!confirmed) {
      return;
    }

    try {
      setActionError('');
      await deleteBlogCategory(category.id);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  return (
    <>
      <MainCard
        title="Blog Kategorileri"
        secondary={
          <Button variant="contained" onClick={openCreate}>
            Yeni Kategori
          </Button>
        }
      >
        <Stack sx={{ gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Bu kategoriler yalnızca blog yazıları içindir. Katalog / etkinlik kategorilerinden ayrıdır. Burada
            oluşturduğunuz kayıtlar, blog yazısı formundaki kategori listesinde görünür.
          </Typography>

          {error && <Alert severity="error">Blog kategorileri alınamadı.</Alert>}
          {actionError && <Alert severity="error">{actionError}</Alert>}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>TR</TableCell>
                  <TableCell>EN</TableCell>
                  <TableCell>RU</TableCell>
                  <TableCell>Slug (TR)</TableCell>
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
                {!isLoading && categories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Henüz blog kategorisi yok.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  categories.map((category) => (
                    <TableRow key={category.id} hover>
                      <TableCell>{getLocalizedName(category, 'tr') || '-'}</TableCell>
                      <TableCell>{getTranslationRow(category.translations, 'en')?.name || '-'}</TableCell>
                      <TableCell>{getTranslationRow(category.translations, 'ru')?.name || '-'}</TableCell>
                      <TableCell>{category.slug}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={category.isActive ? 'Aktif' : 'Pasif'}
                          color={category.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => openEdit(category)}>
                          Düzenle
                        </Button>
                        <Button size="small" color="error" onClick={() => removeCategory(category)}>
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
        <DialogTitle>{editingId ? 'Blog Kategorisi Düzenle' : 'Blog Kategorisi Oluştur'}</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, mt: 1 }}>
            {actionError ? <Alert severity="error">{actionError}</Alert> : null}
            <TranslationLocaleTabs value={localeTab} onChange={setLocaleTab}>
              {(locale) => {
                const row = translations?.[locale] || CATEGORY_FIELDS;
                return (
                  <Stack sx={{ gap: 2 }}>
                    <TextField
                      label="Ad"
                      value={row.name}
                      onChange={(event) =>
                        setTranslations((prev) =>
                          updateLocaleField(prev, locale, 'name', event.target.value, {
                            autoSlugFrom: 'name'
                          })
                        )
                      }
                      required={locale === 'tr'}
                    />
                    <TextField
                      label="Slug"
                      value={row.slug}
                      onChange={(event) =>
                        setTranslations((prev) => updateLocaleField(prev, locale, 'slug', event.target.value))
                      }
                    />
                    <TextField
                      label="Açıklama"
                      value={row.description}
                      onChange={(event) =>
                        setTranslations((prev) =>
                          updateLocaleField(prev, locale, 'description', event.target.value)
                        )
                      }
                      multiline
                      minRows={2}
                    />
                  </Stack>
                );
              }}
            </TranslationLocaleTabs>
            <FormControlLabel
              control={<Switch checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />}
              label="Aktif"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Vazgeç</Button>
          <Button
            variant="contained"
            onClick={submitForm}
            disabled={saving || !String(translations?.tr?.name || '').trim()}
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
