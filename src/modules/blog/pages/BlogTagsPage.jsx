'use client';

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
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
import { createBlogTag, deleteBlogTag, updateBlogTag } from 'modules/blog/api/blog.service';
import useBlogTags from 'modules/blog/hooks/useBlogTags';
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

const TAG_FIELDS = { name: '', slug: '' };

export default function BlogTagsPage() {
  const { tags, isLoading, error, refresh } = useBlogTags();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [translations, setTranslations] = useState(createEmptyTranslations(TAG_FIELDS));
  const [localeTab, setLocaleTab] = useState('tr');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const openCreate = () => {
    setEditingId(null);
    setTranslations(createEmptyTranslations(TAG_FIELDS));
    setLocaleTab('tr');
    setActionError('');
    setDialogOpen(true);
  };

  const openEdit = (tag) => {
    setEditingId(tag.id);
    setTranslations(
      hydrateTranslations(tag?.translations, TAG_FIELDS, {
        name: tag?.name,
        slug: tag?.slug
      })
    );
    setLocaleTab('tr');
    setActionError('');
    setDialogOpen(true);
  };

  const submitForm = async () => {
    setSaving(true);
    setActionError('');

    const payloadTranslations = buildTranslationsPayload(translations, Object.keys(TAG_FIELDS), 'name');
    const root = trAsRoot(translations, { name: 'name', slug: 'slug' });

    if (!String(root.name || '').trim()) {
      setActionError('Etiket adı zorunludur.');
      setSaving(false);
      return;
    }

    const payload = {
      ...root,
      translations: payloadTranslations
    };

    try {
      if (editingId) {
        await updateBlogTag(editingId, payload);
      } else {
        await createBlogTag(payload);
      }
      setDialogOpen(false);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    } finally {
      setSaving(false);
    }
  };

  const removeTag = async (tag) => {
    const confirmed = window.confirm(`“${tag.name}” etiketini silmek istiyor musunuz?`);
    if (!confirmed) {
      return;
    }

    try {
      setActionError('');
      await deleteBlogTag(tag.id);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  return (
    <>
      <MainCard
        title="Blog Etiketleri"
        secondary={
          <Button variant="contained" onClick={openCreate}>
            Yeni Etiket
          </Button>
        }
      >
        <Stack sx={{ gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Etiketler blog yazısı formunda çoklu seçim olarak kullanılır. Önce burada oluşturun, sonra yazıya
            ekleyin.
          </Typography>

          {error && <Alert severity="error">Blog etiketleri alınamadı.</Alert>}
          {actionError && <Alert severity="error">{actionError}</Alert>}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>TR</TableCell>
                  <TableCell>EN</TableCell>
                  <TableCell>RU</TableCell>
                  <TableCell>Slug (TR)</TableCell>
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
                {!isLoading && tags.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Henüz blog etiketi yok.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  tags.map((tag) => (
                    <TableRow key={tag.id} hover>
                      <TableCell>{getLocalizedName(tag, 'tr') || '-'}</TableCell>
                      <TableCell>{getTranslationRow(tag.translations, 'en')?.name || '-'}</TableCell>
                      <TableCell>{getTranslationRow(tag.translations, 'ru')?.name || '-'}</TableCell>
                      <TableCell>{tag.slug}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => openEdit(tag)}>
                          Düzenle
                        </Button>
                        <Button size="small" color="error" onClick={() => removeTag(tag)}>
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
        <DialogTitle>{editingId ? 'Etiket Düzenle' : 'Etiket Oluştur'}</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, mt: 1 }}>
            {actionError ? <Alert severity="error">{actionError}</Alert> : null}
            <TranslationLocaleTabs value={localeTab} onChange={setLocaleTab}>
              {(locale) => {
                const row = translations?.[locale] || TAG_FIELDS;
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
                  </Stack>
                );
              }}
            </TranslationLocaleTabs>
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
