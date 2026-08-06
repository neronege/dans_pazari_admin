'use client';

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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
import {
  createLegalPage,
  deleteLegalPage,
  getLegalPageDetail,
  publishLegalPage,
  unpublishLegalPage,
  upsertLegalPage
} from 'modules/legal/api/legal.service';
import useLegalPages from 'modules/legal/hooks/useLegalPages';
import { getHumanReadableError, getProblemFieldErrors } from 'shared/api';
import {
  buildTranslationsPayload,
  createEmptyTranslations,
  hydrateTranslations,
  toContentSlug,
  trAsRoot,
  updateLocaleField
} from 'shared/i18n/contentLocales';
import TranslationLocaleTabs from 'shared/i18n/TranslationLocaleTabs';
import { clearFieldError, getFieldError, getLocaleTabFromFieldErrors, withFieldError } from 'shared/ui/fieldErrors';

const LEGAL_FIELDS = { title: '', bodyHtml: '' };

const SLUG_LABELS = {
  kvkk: 'KVKK',
  'cerez-politikasi': 'Çerez Politikası',
  'kullanim-kosullari': 'Kullanım Koşulları',
  'mesafeli-satis': 'Mesafeli Satış'
};

export default function LegalPagesPage() {
  const { pages, isLoading, error, refresh } = useLegalPages();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreate, setIsCreate] = useState(false);
  const [editingSlug, setEditingSlug] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [translations, setTranslations] = useState(createEmptyTranslations(LEGAL_FIELDS));
  const [localeTab, setLocaleTab] = useState('tr');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const openCreate = () => {
    setIsCreate(true);
    setEditingSlug('');
    setSlug('');
    setSlugTouched(false);
    setTranslations(createEmptyTranslations(LEGAL_FIELDS));
    setLocaleTab('tr');
    setActionError('');
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEdit = async (pageSlug) => {
    try {
      setActionError('');
      const detail = await getLegalPageDetail(pageSlug);
      setIsCreate(false);
      setEditingSlug(pageSlug);
      setSlug(detail?.slug || pageSlug);
      setSlugTouched(true);
      setTranslations(
        hydrateTranslations(detail?.translations, LEGAL_FIELDS, {
          title: detail?.title,
          bodyHtml: detail?.bodyHtml
        })
      );
      setLocaleTab('tr');
      setFormErrors({});
      setDialogOpen(true);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onTitleChange = (locale, value) => {
    setTranslations((prev) => {
      const next = updateLocaleField(prev, locale, 'title', value);
      if (locale === 'tr' && !slugTouched) {
        setSlug(toContentSlug(value));
      }
      return next;
    });
    setFormErrors((prev) => clearFieldError(prev, `translations.${locale}.title`));
  };

  const submitForm = async () => {
    setSaving(true);
    setActionError('');

    const payloadTranslations = buildTranslationsPayload(translations, Object.keys(LEGAL_FIELDS), 'title');
    const root = trAsRoot(translations, { title: 'title', bodyHtml: 'bodyHtml' });
    const normalizedSlug = toContentSlug(slug || root.title || '');

    const nextErrors = {};

    if (!String(root.title || '').trim()) {
      nextErrors['translations.tr.title'] = 'Başlık zorunludur.';
    }

    if (!normalizedSlug) {
      nextErrors.slug = 'Slug zorunludur.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      setLocaleTab('tr');
      setSaving(false);
      return;
    }

    setFormErrors({});

    const payload = {
      ...root,
      bodyHtml: root.bodyHtml || '',
      slug: normalizedSlug,
      translations: payloadTranslations
    };

    try {
      if (isCreate) {
        await createLegalPage(payload);
      } else {
        await upsertLegalPage(editingSlug, payload);
      }
      setDialogOpen(false);
      await refresh();
    } catch (requestError) {
      const apiFieldErrors = getProblemFieldErrors(requestError?.problem, {
        slug: ['slug'],
        'translations.tr.title': ['title'],
        'translations.tr.bodyHtml': ['bodyHtml', 'contentHtml']
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

  const togglePublish = async (page) => {
    try {
      setActionError('');
      if (page.isPublished) {
        await unpublishLegalPage(page.slug);
      } else {
        await publishLegalPage(page.slug);
      }
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const removePage = async (page) => {
    const label = SLUG_LABELS[page.slug] || page.title || page.slug;
    const confirmed = window.confirm(`“${label}” sayfasını silmek istiyor musunuz?`);
    if (!confirmed) {
      return;
    }

    try {
      setActionError('');
      await deleteLegalPage(page.slug);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  return (
    <>
      <MainCard
        title="Yasal Sayfalar"
        secondary={
          <Button variant="contained" onClick={openCreate}>
            Yeni Sayfa
          </Button>
        }
      >
        <Stack sx={{ gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            İstediğiniz yasal sayfayı ekleyebilir, slug/başlık düzenleyebilir veya silebilirsiniz. Slug dil bağımsızdır;
            başlık ve içerik çevrilir.
          </Typography>

          {error && <Alert severity="error">Yasal sayfalar alınamadı.</Alert>}
          {actionError && <Alert severity="error">{actionError}</Alert>}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Sayfa</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>Başlık</TableCell>
                  <TableCell>Durum</TableCell>
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

                {!isLoading && pages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Henüz yasal sayfa yok.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  pages.map((page) => (
                    <TableRow key={page.slug} hover>
                      <TableCell>{SLUG_LABELS[page.slug] || page.title || page.slug}</TableCell>
                      <TableCell>{page.slug}</TableCell>
                      <TableCell>{page.title || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={page.isPublished ? 'Yayında' : 'Taslak'}
                          color={page.isPublished ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => openEdit(page.slug)}>
                          Düzenle
                        </Button>
                        <Button
                          size="small"
                          onClick={() => togglePublish(page)}
                          disabled={page.existsInDatabase === false}
                        >
                          {page.isPublished ? 'Yayından Kaldır' : 'Yayınla'}
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => removePage(page)}
                          disabled={page.existsInDatabase === false}
                        >
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
        <DialogTitle>{isCreate ? 'Yasal Sayfa Oluştur' : 'Yasal Sayfa Düzenle'}</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, mt: 1 }}>
            <TextField
              label="Slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(toContentSlug(event.target.value));
                setFormErrors((prev) => clearFieldError(prev, 'slug'));
              }}
              error={Boolean(getFieldError(formErrors, 'slug'))}
              helperText={withFieldError(getFieldError(formErrors, 'slug'), 'URL anahtarı (örn. kvkk, gizlilik-politikasi). Dil bağımsızdır.')}
              required
            />
            <TranslationLocaleTabs value={localeTab} onChange={setLocaleTab}>
              {(locale) => {
                const row = translations?.[locale] || LEGAL_FIELDS;
                return (
                  <Stack sx={{ gap: 2 }}>
                    <TextField
                      label="Başlık"
                      value={row.title}
                      onChange={(event) => onTitleChange(locale, event.target.value)}
                      required={locale === 'tr'}
                      error={Boolean(getFieldError(formErrors, `translations.${locale}.title`))}
                      helperText={getFieldError(formErrors, `translations.${locale}.title`)}
                    />
                    <TextField
                      label="İçerik (HTML)"
                      value={row.bodyHtml}
                      onChange={(event) =>
                        setTranslations((prev) => updateLocaleField(prev, locale, 'bodyHtml', event.target.value))
                      }
                      multiline
                      minRows={10}
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
            disabled={saving}
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
