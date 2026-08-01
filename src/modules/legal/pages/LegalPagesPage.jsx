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
  getLegalPageDetail,
  publishLegalPage,
  unpublishLegalPage,
  upsertLegalPage
} from 'modules/legal/api/legal.service';
import useLegalPages from 'modules/legal/hooks/useLegalPages';
import { getHumanReadableError } from 'shared/api';
import {
  buildTranslationsPayload,
  createEmptyTranslations,
  hydrateTranslations,
  trAsRoot,
  updateLocaleField
} from 'shared/i18n/contentLocales';
import TranslationLocaleTabs from 'shared/i18n/TranslationLocaleTabs';

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
  const [editingSlug, setEditingSlug] = useState('');
  const [translations, setTranslations] = useState(createEmptyTranslations(LEGAL_FIELDS));
  const [localeTab, setLocaleTab] = useState('tr');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const openEdit = async (slug) => {
    try {
      setActionError('');
      const detail = await getLegalPageDetail(slug);
      setEditingSlug(slug);
      setTranslations(
        hydrateTranslations(detail?.translations, LEGAL_FIELDS, {
          title: detail?.title,
          bodyHtml: detail?.bodyHtml
        })
      );
      setLocaleTab('tr');
      setDialogOpen(true);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const submitForm = async () => {
    setSaving(true);
    setActionError('');

    const payloadTranslations = buildTranslationsPayload(translations, Object.keys(LEGAL_FIELDS), 'title');
    const root = trAsRoot(translations, { title: 'title', bodyHtml: 'bodyHtml' });

    try {
      await upsertLegalPage(editingSlug, {
        ...root,
        translations: payloadTranslations
      });
      setDialogOpen(false);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
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

  return (
    <>
      <MainCard title="Yasal Sayfalar">
        <Stack sx={{ gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Sabit slug’lar (kvkk, çerez, kullanım koşulları, mesafeli satış). Slug dil bağımsız; yalnızca başlık ve içerik
            çevrilir.
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

                {!isLoading &&
                  pages.map((page) => (
                    <TableRow key={page.slug} hover>
                      <TableCell>{SLUG_LABELS[page.slug] || page.slug}</TableCell>
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
                        <Button size="small" onClick={() => togglePublish(page)} disabled={!page.title}>
                          {page.isPublished ? 'Yayından Kaldır' : 'Yayınla'}
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
        <DialogTitle>
          {SLUG_LABELS[editingSlug] || editingSlug} — Düzenle
        </DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Slug: <strong>{editingSlug}</strong> (sabit)
            </Typography>
            <TranslationLocaleTabs value={localeTab} onChange={setLocaleTab}>
              {(locale) => {
                const row = translations?.[locale] || LEGAL_FIELDS;
                return (
                  <Stack sx={{ gap: 2 }}>
                    <TextField
                      label="Başlık"
                      value={row.title}
                      onChange={(event) =>
                        setTranslations((prev) => updateLocaleField(prev, locale, 'title', event.target.value))
                      }
                      required={locale === 'tr'}
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
            disabled={saving || !String(translations?.tr?.title || '').trim()}
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
