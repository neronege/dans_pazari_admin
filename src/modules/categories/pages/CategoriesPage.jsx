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
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import MainCard from 'components/MainCard';
import ArrowUpOutlined from '@ant-design/icons/ArrowUpOutlined';
import ArrowDownOutlined from '@ant-design/icons/ArrowDownOutlined';
import useCategories from 'modules/categories/hooks/useCategories';
import {
  createCategory,
  deleteCategory,
  getCategoryDetail,
  reorderCategories,
  updateCategory,
  updateCategoryActive
} from 'modules/categories/api/categories.service';
import { getHumanReadableError } from 'shared/api';
import {
  buildTranslationsPayload,
  createEmptyTranslations,
  hydrateTranslations,
  trAsRoot,
  updateLocaleField
} from 'shared/i18n/contentLocales';
import TranslationLocaleTabs from 'shared/i18n/TranslationLocaleTabs';
import { clearFieldError, getFieldError } from 'shared/ui/fieldErrors';

const CATEGORY_FIELDS = { name: '', slug: '', description: '' };

const initialForm = {
  translations: createEmptyTranslations(CATEGORY_FIELDS),
  parentCategoryId: '',
  sortOrder: 0,
  isActive: true
};

function flattenCategories(categories, level = 0) {
  return (categories || []).flatMap((category) => {
    const row = {
      ...category,
      level
    };

    return [row, ...flattenCategories(category.children || [], level + 1)];
  });
}

export default function CategoriesPage() {
  const { categories, isLoading, error, refresh } = useCategories();

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [localeTab, setLocaleTab] = useState('tr');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    setRows(flattenCategories(categories));
  }, [categories]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) {
      return rows;
    }

    const query = search.toLowerCase();
    return rows.filter((row) => `${row.name || ''} ${row.slug || ''}`.toLowerCase().includes(query));
  }, [rows, search]);

  const trName = form.translations?.tr?.name || '';

  const openCreateDialog = () => {
    setEditingId(null);
    setForm({
      ...initialForm,
      translations: createEmptyTranslations(CATEGORY_FIELDS)
    });
    setLocaleTab('tr');
    setActionError('');
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEditDialog = async (categoryId) => {
    try {
      setActionError('');
      const detail = await getCategoryDetail(categoryId);

      setEditingId(categoryId);
      setForm({
        translations: hydrateTranslations(detail?.translations, CATEGORY_FIELDS, {
          name: detail?.name,
          slug: detail?.slug,
          description: detail?.description
        }),
        parentCategoryId: detail?.parentCategoryId || '',
        sortOrder: Number(detail?.sortOrder || 0),
        isActive: detail?.isActive ?? true
      });
      setLocaleTab('tr');
      setFormErrors({});
      setDialogOpen(true);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const setLocaleValue = (locale, field, value) => {
    setForm((prev) => ({
      ...prev,
      translations: updateLocaleField(prev.translations, locale, field, value, {
        autoSlugFrom: field === 'name' ? 'name' : undefined
      })
    }));
    setFormErrors((prev) => clearFieldError(prev, `translations.${locale}.${field}`));
  };

  const submitForm = async () => {
    setSaving(true);
    setActionError('');

    if (!String(form.translations?.tr?.name || '').trim()) {
      setFormErrors({ 'translations.tr.name': 'Ad zorunludur.' });
      setLocaleTab('tr');
      setSaving(false);
      return;
    }

    setFormErrors({});

    const translations = buildTranslationsPayload(form.translations, Object.keys(CATEGORY_FIELDS), 'name');
    const root = trAsRoot(form.translations, { name: 'name', slug: 'slug', description: 'description' });

    const payload = {
      ...root,
      parentCategoryId: form.parentCategoryId || null,
      sortOrder: Number(form.sortOrder || 0),
      isActive: Boolean(form.isActive),
      translations
    };

    try {
      if (editingId) {
        await updateCategory(editingId, payload);
      } else {
        await createCategory(payload);
      }

      setDialogOpen(false);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row) => {
    try {
      setActionError('');
      await updateCategoryActive(row.id, !row.isActive);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const removeCategory = async (row) => {
    const confirmed = window.confirm(`${row.name} kategorisini silmek istiyor musunuz?`);
    if (!confirmed) {
      return;
    }

    try {
      setActionError('');
      await deleteCategory(row.id);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const moveRow = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= rows.length) {
      return;
    }

    const clone = [...rows];
    const temp = clone[index];
    clone[index] = clone[targetIndex];
    clone[targetIndex] = temp;
    setRows(clone);
  };

  const saveOrder = async () => {
    const items = rows.map((row, index) => ({ id: row.id, sortOrder: index }));

    try {
      setActionError('');
      await reorderCategories(items);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const localeRow = form.translations?.[localeTab] || CATEGORY_FIELDS;

  return (
    <>
      <MainCard
        title="Kategori Yönetimi"
        secondary={
          <Button variant="contained" onClick={openCreateDialog}>
            Yeni Kategori
          </Button>
        }
      >
        <Stack sx={{ gap: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
            <TextField
              label="Ara"
              placeholder="Kategori adi veya slug"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              fullWidth
            />
            <Button variant="outlined" onClick={saveOrder}>
              Sıralamayı Kaydet
            </Button>
          </Stack>

          {error && <Alert severity="error">Kategori listesi alınamadı.</Alert>}
          {actionError && <Alert severity="error">{actionError}</Alert>}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Ad</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Sira</TableCell>
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

                {!isLoading && filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Gösterilecek kategori bulunamadı.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  filteredRows.map((row) => {
                    const realIndex = rows.findIndex((item) => item.id === row.id);

                    return (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Box sx={{ pl: row.level * 2 }}>{row.name}</Box>
                        </TableCell>
                        <TableCell>{row.slug || '-'}</TableCell>
                        <TableCell>{row.isActive ? 'Aktif' : 'Pasif'}</TableCell>
                        <TableCell>{row.sortOrder ?? '-'}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => moveRow(realIndex, -1)}>
                            <ArrowUpOutlined />
                          </IconButton>
                          <IconButton size="small" onClick={() => moveRow(realIndex, 1)}>
                            <ArrowDownOutlined />
                          </IconButton>
                          <Button size="small" onClick={() => openEditDialog(row.id)}>
                            Düzenle
                          </Button>
                          <Button size="small" onClick={() => toggleActive(row)}>
                            {row.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                          </Button>
                          <Button size="small" color="error" onClick={() => removeCategory(row)}>
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
        <DialogTitle>{editingId ? 'Kategori Düzenle' : 'Kategori Oluştur'}</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, mt: 1 }}>
            <TranslationLocaleTabs value={localeTab} onChange={setLocaleTab}>
              {() => (
                <Stack sx={{ gap: 2 }}>
                  <TextField
                    label="Ad"
                    value={localeRow.name}
                    onChange={(event) => setLocaleValue(localeTab, 'name', event.target.value)}
                    required={localeTab === 'tr'}
                    error={Boolean(getFieldError(formErrors, `translations.${localeTab}.name`))}
                    helperText={getFieldError(formErrors, `translations.${localeTab}.name`)}
                  />
                  <TextField label="Slug" value={localeRow.slug} slotProps={{ input: { readOnly: true } }} />
                  <TextField
                    label="Açıklama"
                    value={localeRow.description}
                    onChange={(event) => setLocaleValue(localeTab, 'description', event.target.value)}
                    multiline
                    minRows={3}
                  />
                </Stack>
              )}
            </TranslationLocaleTabs>

            <TextField
              select
              label="Üst Kategori"
              value={form.parentCategoryId}
              onChange={(event) => setForm((prev) => ({ ...prev, parentCategoryId: event.target.value }))}
            >
              <MenuItem value="">Yok</MenuItem>
              {rows
                .filter((row) => row.id !== editingId)
                .map((row) => (
                  <MenuItem key={row.id} value={row.id}>
                    {row.name}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              type="number"
              label="Sira"
              value={form.sortOrder}
              onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
            />
            <FormControlLabel
              control={
                <Switch checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />
              }
              label="Aktif"
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
    </>
  );
}
