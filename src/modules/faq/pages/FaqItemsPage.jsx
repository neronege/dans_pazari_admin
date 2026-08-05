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
  createFaqItem,
  deleteFaqItem,
  getFaqItemDetail,
  publishFaqItem,
  unpublishFaqItem,
  updateFaqItem
} from 'modules/faq/api/faq.service';
import useFaqItems from 'modules/faq/hooks/useFaqItems';
import { getHumanReadableError } from 'shared/api';
import {
  buildTranslationsPayload,
  createEmptyTranslations,
  hydrateTranslations,
  trAsRoot,
  updateLocaleField
} from 'shared/i18n/contentLocales';
import TranslationLocaleTabs from 'shared/i18n/TranslationLocaleTabs';

const FAQ_FIELDS = { question: '', answer: '' };

function truncate(text, max = 80) {
  const value = String(text || '').trim();
  if (value.length <= max) {
    return value || '-';
  }
  return `${value.slice(0, max)}…`;
}

export default function FaqItemsPage() {
  const { items, isLoading, error, refresh } = useFaqItems();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreate, setIsCreate] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [translations, setTranslations] = useState(createEmptyTranslations(FAQ_FIELDS));
  const [localeTab, setLocaleTab] = useState('tr');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const openCreate = () => {
    setIsCreate(true);
    setEditingId('');
    setSortOrder(items.length);
    setTranslations(createEmptyTranslations(FAQ_FIELDS));
    setLocaleTab('tr');
    setActionError('');
    setDialogOpen(true);
  };

  const openEdit = async (id) => {
    try {
      setActionError('');
      const detail = await getFaqItemDetail(id);
      setIsCreate(false);
      setEditingId(id);
      setSortOrder(Number.isFinite(detail?.sortOrder) ? detail.sortOrder : 0);
      setTranslations(
        hydrateTranslations(detail?.translations, FAQ_FIELDS, {
          question: detail?.question,
          answer: detail?.answer
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

    for (const { code, label } of [
      { code: 'en', label: 'EN' },
      { code: 'ru', label: 'RU' }
    ]) {
      const row = translations?.[code] || {};
      const question = String(row.question || '').trim();
      const answer = String(row.answer || '').trim();
      const touched = Boolean(question || answer);

      if (!touched) {
        continue;
      }

      if (!question) {
        setActionError(`${label} çevirisi için Soru zorunludur. Eksik alanı doldurun veya ${label} alanlarını boş bırakın.`);
        setLocaleTab(code);
        setSaving(false);
        return;
      }
    }

    const payloadTranslations = buildTranslationsPayload(translations, Object.keys(FAQ_FIELDS), 'question');
    const root = trAsRoot(translations, { question: 'question', answer: 'answer' });

    if (!String(root.question || '').trim()) {
      setActionError('Soru zorunludur.');
      setLocaleTab('tr');
      setSaving(false);
      return;
    }

    const payload = {
      question: root.question,
      answer: root.answer || '',
      sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
      translations: payloadTranslations
    };

    try {
      if (isCreate) {
        await createFaqItem(payload);
      } else {
        await updateFaqItem(editingId, payload);
      }
      setDialogOpen(false);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (item) => {
    try {
      setActionError('');
      if (item.isPublished) {
        await unpublishFaqItem(item.id);
      } else {
        await publishFaqItem(item.id);
      }
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const removeItem = async (item) => {
    const label = truncate(item.question, 60);
    const confirmed = window.confirm(`“${label}” maddesini silmek istiyor musunuz?`);
    if (!confirmed) {
      return;
    }

    try {
      setActionError('');
      await deleteFaqItem(item.id);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  return (
    <>
      <MainCard
        title="SSS (FAQ)"
        secondary={
          <Button variant="contained" onClick={openCreate}>
            Yeni Madde
          </Button>
        }
      >
        <Stack sx={{ gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Sık sorulan soruları ekleyin, sıralayın ve yayınlayın. Sıra numarası dil bağımsızdır; soru ve cevap
            çevrilir.
          </Typography>

          {error && <Alert severity="error">SSS listesi alınamadı.</Alert>}
          {actionError && <Alert severity="error">{actionError}</Alert>}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={80}>Sıra</TableCell>
                  <TableCell>Soru</TableCell>
                  <TableCell>Cevap</TableCell>
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

                {!isLoading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Henüz SSS maddesi yok.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.sortOrder}</TableCell>
                      <TableCell>{truncate(item.question, 100)}</TableCell>
                      <TableCell>{truncate(item.answer, 100)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={item.isPublished ? 'Yayında' : 'Taslak'}
                          color={item.isPublished ? 'success' : 'default'}
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
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </MainCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{isCreate ? 'SSS Maddesi Oluştur' : 'SSS Maddesi Düzenle'}</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, mt: 1 }}>
            {actionError ? <Alert severity="error">{actionError}</Alert> : null}
            <TextField
              label="Sıra"
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(Number(event.target.value))}
              helperText="Küçük numara önce görünür."
              inputProps={{ min: 0 }}
            />
            <TranslationLocaleTabs value={localeTab} onChange={setLocaleTab}>
              {(locale) => {
                const row = translations?.[locale] || FAQ_FIELDS;
                return (
                  <Stack sx={{ gap: 2 }}>
                    <TextField
                      label="Soru"
                      value={row.question}
                      onChange={(event) =>
                        setTranslations((prev) => updateLocaleField(prev, locale, 'question', event.target.value))
                      }
                      required={locale === 'tr'}
                      fullWidth
                    />
                    <TextField
                      label="Cevap"
                      value={row.answer}
                      onChange={(event) =>
                        setTranslations((prev) => updateLocaleField(prev, locale, 'answer', event.target.value))
                      }
                      multiline
                      minRows={6}
                      fullWidth
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
            disabled={saving || !String(translations?.tr?.question || '').trim()}
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
