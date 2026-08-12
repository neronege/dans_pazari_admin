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
import Link from '@mui/material/Link';
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
  createPartner,
  deletePartner,
  getPartnerDetail,
  updatePartner,
  updatePartnerActive
} from 'modules/partners/api/partners.service';
import usePartners from 'modules/partners/hooks/usePartners';
import { getHumanReadableError, getProblemFieldErrors } from 'shared/api';
import { clearFieldError, getFieldError } from 'shared/ui/fieldErrors';

const EMPTY_COMPANY_FORM = {
  companyTitle: '',
  phone: '',
  authorizedPerson: '',
  email: '',
  isActive: true
};

const EMPTY_PERSON_FORM = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  isActive: true
};

const ALLOWED_TAX_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_TAX_BYTES = 10 * 1024 * 1024;

const COMPANY_FIELD_MAP = {
  companyTitle: ['companyTitle', 'CompanyTitle'],
  phone: ['phone', 'Phone'],
  authorizedPerson: ['authorizedPerson', 'AuthorizedPerson'],
  email: ['email', 'Email']
};

const PERSON_FIELD_MAP = {
  firstName: ['companyTitle', 'CompanyTitle', 'authorizedPerson', 'AuthorizedPerson'],
  email: ['email', 'Email'],
  phone: ['phone', 'Phone']
};

function splitPersonName(fullName) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/**
 * @param {'company' | 'person'} formMode
 */
export default function PartnersPage({
  kind,
  title,
  addLabel,
  editLabel,
  emptyLabel,
  description,
  formMode = 'company'
}) {
  const isPerson = formMode === 'person';
  const [search, setSearch] = useState('');
  const { items, isLoading, error, refresh } = usePartners({ kind, search });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [companyForm, setCompanyForm] = useState(EMPTY_COMPANY_FORM);
  const [personForm, setPersonForm] = useState(EMPTY_PERSON_FORM);
  const [taxFile, setTaxFile] = useState(null);
  const [existingTaxUrl, setExistingTaxUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const openCreate = () => {
    setEditingId(null);
    setCompanyForm({ ...EMPTY_COMPANY_FORM });
    setPersonForm({ ...EMPTY_PERSON_FORM });
    setTaxFile(null);
    setExistingTaxUrl('');
    setActionError('');
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEdit = async (id) => {
    try {
      setActionError('');
      const detail = await getPartnerDetail(id);
      setEditingId(id);

      if (isPerson) {
        const fromTitle = splitPersonName(detail?.companyTitle || detail?.name || '');
        const fromAuthorized = splitPersonName(detail?.authorizedPerson || '');
        setPersonForm({
          firstName: fromTitle.firstName || fromAuthorized.firstName || '',
          lastName: fromTitle.lastName || fromAuthorized.lastName || '',
          phone: detail?.phone || '',
          email: detail?.email || '',
          isActive: detail?.isActive ?? true
        });
      } else {
        setCompanyForm({
          companyTitle: detail?.companyTitle || '',
          phone: detail?.phone || '',
          authorizedPerson: detail?.authorizedPerson || '',
          email: detail?.email || '',
          isActive: detail?.isActive ?? true
        });
      }

      setTaxFile(null);
      setExistingTaxUrl(detail?.taxCertificateUrl || '');
      setFormErrors({});
      setDialogOpen(true);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onTaxFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setActionError('');

    if (!file) {
      setTaxFile(null);
      return;
    }

    if (!ALLOWED_TAX_TYPES.includes(file.type)) {
      setActionError('Vergi levhası PDF, JPEG, PNG veya WebP olmalıdır.');
      event.target.value = '';
      setTaxFile(null);
      return;
    }

    if (file.size > MAX_TAX_BYTES) {
      setActionError('Vergi levhası en fazla 10 MB olabilir.');
      event.target.value = '';
      setTaxFile(null);
      return;
    }

    setTaxFile(file);
  };

  const validateClient = () => {
    const nextErrors = {};

    if (isPerson) {
      if (!String(personForm.firstName || '').trim()) {
        nextErrors.firstName = 'Ad zorunludur.';
      }
      if (!String(personForm.lastName || '').trim()) {
        nextErrors.lastName = 'Soyad zorunludur.';
      }
      if (!String(personForm.email || '').trim()) {
        nextErrors.email = 'E-posta zorunludur.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(personForm.email).trim())) {
        nextErrors.email = 'Geçerli bir e-posta girin.';
      }
    } else {
      if (!String(companyForm.companyTitle || '').trim()) {
        nextErrors.companyTitle = 'Şirket unvanı zorunludur.';
      }
      if (!String(companyForm.phone || '').trim()) {
        nextErrors.phone = 'Telefon numarası zorunludur.';
      }
      if (!String(companyForm.authorizedPerson || '').trim()) {
        nextErrors.authorizedPerson = 'Yetkili kişi zorunludur.';
      }
      if (!String(companyForm.email || '').trim()) {
        nextErrors.email = 'Mail adresi zorunludur.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(companyForm.email).trim())) {
        nextErrors.email = 'Geçerli bir mail adresi girin.';
      }
    }

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

    let payload;
    let file = null;

    if (isPerson) {
      const fullName = `${String(personForm.firstName).trim()} ${String(personForm.lastName).trim()}`.trim();
      const phone = String(personForm.phone || '').trim() || '-';
      payload = {
        kind,
        companyTitle: fullName,
        phone,
        authorizedPerson: fullName,
        email: String(personForm.email).trim(),
        isActive: Boolean(personForm.isActive)
      };
    } else {
      payload = {
        kind,
        companyTitle: String(companyForm.companyTitle).trim(),
        phone: String(companyForm.phone).trim(),
        authorizedPerson: String(companyForm.authorizedPerson).trim(),
        email: String(companyForm.email).trim(),
        isActive: Boolean(companyForm.isActive)
      };
      file = taxFile;
    }

    try {
      if (editingId) {
        await updatePartner(editingId, payload, file);
      } else {
        await createPartner(payload, file);
      }
      setDialogOpen(false);
      await refresh();
    } catch (requestError) {
      const apiFieldErrors = getProblemFieldErrors(
        requestError?.problem,
        isPerson ? PERSON_FIELD_MAP : COMPANY_FIELD_MAP
      );
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

  const toggleActive = async (item) => {
    try {
      setActionError('');
      await updatePartnerActive(item.id, !item.isActive);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const removeItem = async (item) => {
    const label = item.companyTitle || item.name || 'kayıt';
    if (!window.confirm(`“${label}” kaydını silmek istiyor musunuz?`)) {
      return;
    }

    try {
      setActionError('');
      await deletePartner(item.id);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const setCompanyField = (key, value) => {
    setCompanyForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => clearFieldError(prev, key));
  };

  const setPersonField = (key, value) => {
    setPersonForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => clearFieldError(prev, key));
  };

  const colSpan = isPerson ? 5 : 7;

  return (
    <>
      <MainCard
        title={title}
        secondary={
          <Button variant="contained" onClick={openCreate}>
            {addLabel}
          </Button>
        }
      >
        <Stack sx={{ gap: 2 }}>
          {description ? (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          ) : null}

          <TextField
            size="small"
            label="Ara"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={isPerson ? 'Ad, soyad veya mail' : 'Şirket, yetkili veya mail'}
            sx={{ maxWidth: 360 }}
          />

          {error && <Alert severity="error">Liste alınamadı.</Alert>}
          {actionError && !dialogOpen && <Alert severity="error">{actionError}</Alert>}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {isPerson ? (
                    <>
                      <TableCell>Ad Soyad</TableCell>
                      <TableCell>Telefon</TableCell>
                      <TableCell>E-posta</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>Şirket Unvanı</TableCell>
                      <TableCell>Yetkili Kişi</TableCell>
                      <TableCell>Telefon</TableCell>
                      <TableCell>Mail</TableCell>
                      <TableCell>Vergi Levhası</TableCell>
                    </>
                  )}
                  <TableCell>Durum</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={colSpan} align="center">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={colSpan} align="center">
                      {emptyLabel}
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  items.map((item) => (
                    <TableRow key={item.id} hover>
                      {isPerson ? (
                        <>
                          <TableCell>{item.companyTitle || item.name || '-'}</TableCell>
                          <TableCell>{item.phone === '-' ? '-' : item.phone || '-'}</TableCell>
                          <TableCell>{item.email || '-'}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{item.companyTitle || item.name || '-'}</TableCell>
                          <TableCell>{item.authorizedPerson || '-'}</TableCell>
                          <TableCell>{item.phone || '-'}</TableCell>
                          <TableCell>{item.email || '-'}</TableCell>
                          <TableCell>
                            {item.taxCertificateUrl ? (
                              <Link href={item.taxCertificateUrl} target="_blank" rel="noopener noreferrer">
                                Görüntüle
                              </Link>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <Chip
                          size="small"
                          label={item.isActive ? 'Aktif' : 'Pasif'}
                          color={item.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => openEdit(item.id)}>
                          Düzenle
                        </Button>
                        <Button size="small" onClick={() => toggleActive(item)}>
                          {item.isActive ? 'Pasifleştir' : 'Aktifleştir'}
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? editLabel || 'Düzenle' : addLabel}</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, mt: 1 }}>
            {actionError ? <Alert severity="error">{actionError}</Alert> : null}

            {isPerson ? (
              <>
                <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
                  <TextField
                    label="Ad"
                    value={personForm.firstName}
                    onChange={(event) => setPersonField('firstName', event.target.value)}
                    required
                    fullWidth
                    error={Boolean(getFieldError(formErrors, 'firstName'))}
                    helperText={getFieldError(formErrors, 'firstName')}
                  />
                  <TextField
                    label="Soyad"
                    value={personForm.lastName}
                    onChange={(event) => setPersonField('lastName', event.target.value)}
                    required
                    fullWidth
                    error={Boolean(getFieldError(formErrors, 'lastName'))}
                    helperText={getFieldError(formErrors, 'lastName')}
                  />
                </Stack>
                <TextField
                  label="E-posta"
                  type="email"
                  value={personForm.email}
                  onChange={(event) => setPersonField('email', event.target.value)}
                  required
                  fullWidth
                  error={Boolean(getFieldError(formErrors, 'email'))}
                  helperText={getFieldError(formErrors, 'email')}
                />
                <TextField
                  label="Telefon"
                  value={personForm.phone}
                  onChange={(event) => setPersonField('phone', event.target.value)}
                  fullWidth
                  error={Boolean(getFieldError(formErrors, 'phone'))}
                  helperText={getFieldError(formErrors, 'phone')}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(personForm.isActive)}
                      onChange={(event) => setPersonField('isActive', event.target.checked)}
                    />
                  }
                  label="Aktif"
                />
              </>
            ) : (
              <>
                <TextField
                  label="Şirket Unvanı"
                  value={companyForm.companyTitle}
                  onChange={(event) => setCompanyField('companyTitle', event.target.value)}
                  required
                  fullWidth
                  error={Boolean(getFieldError(formErrors, 'companyTitle'))}
                  helperText={getFieldError(formErrors, 'companyTitle')}
                />
                <TextField
                  label="Telefon Numarası"
                  value={companyForm.phone}
                  onChange={(event) => setCompanyField('phone', event.target.value)}
                  required
                  fullWidth
                  error={Boolean(getFieldError(formErrors, 'phone'))}
                  helperText={getFieldError(formErrors, 'phone')}
                />
                <TextField
                  label="Yetkili Kişi"
                  value={companyForm.authorizedPerson}
                  onChange={(event) => setCompanyField('authorizedPerson', event.target.value)}
                  required
                  fullWidth
                  error={Boolean(getFieldError(formErrors, 'authorizedPerson'))}
                  helperText={getFieldError(formErrors, 'authorizedPerson')}
                />
                <TextField
                  label="Mail Adresi"
                  type="email"
                  value={companyForm.email}
                  onChange={(event) => setCompanyField('email', event.target.value)}
                  required
                  fullWidth
                  error={Boolean(getFieldError(formErrors, 'email'))}
                  helperText={getFieldError(formErrors, 'email')}
                />
                <Stack sx={{ gap: 1 }}>
                  <Typography variant="subtitle2">Vergi Levhası</Typography>
                  {existingTaxUrl && !taxFile ? (
                    <Typography variant="body2">
                      Mevcut:{' '}
                      <Link href={existingTaxUrl} target="_blank" rel="noopener noreferrer">
                        Dosyayı aç
                      </Link>
                    </Typography>
                  ) : null}
                  <Button variant="outlined" component="label">
                    {taxFile ? taxFile.name : existingTaxUrl ? 'Dosyayı değiştir' : 'Dosya seç'}
                    <input
                      hidden
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      onChange={onTaxFileChange}
                    />
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    PDF, JPEG, PNG veya WebP — en fazla 10 MB
                  </Typography>
                </Stack>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(companyForm.isActive)}
                      onChange={(event) => setCompanyField('isActive', event.target.checked)}
                    />
                  }
                  label="Aktif"
                />
              </>
            )}
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
