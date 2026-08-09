'use client';

import { useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
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
  activateUser,
  banUser,
  createUser,
  deleteUser,
  getUserDetail,
  suspendUser
} from 'modules/users/api/users.service';
import useUsers from 'modules/users/hooks/useUsers';
import useEvents from 'modules/events/hooks/useEvents';
import { getHumanReadableError } from 'shared/api';

function field(value, fallback = '-') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return value;
}

function roleLabel(role) {
  if (role === 'DoorStaff') return 'Kapı Personeli';
  if (role === 'Customer') return 'Müşteri';
  return field(role);
}

const EMPTY_CREATE = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  role: 'Customer',
  gender: 3,
  assignedEventId: ''
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [isGuest, setIsGuest] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionInfo, setActionInfo] = useState('');

  const { users, totalCount, isLoading, error, refresh } = useUsers({
    page,
    pageSize: 20,
    search,
    status,
    isGuest,
    role
  });
  const { events: eventOptions = [] } = useEvents({});

  const eventTitleById = useMemo(() => {
    const map = new Map();
    (eventOptions || []).forEach((event) => {
      if (event?.id) {
        map.set(event.id, event.title || event.name || event.slug || event.id);
      }
    });
    return map;
  }, [eventOptions]);

  const pageCount = Math.max(1, Math.ceil(totalCount / 20));

  const openDetail = async (userId) => {
    try {
      setActionError('');
      const response = await getUserDetail(userId);
      setDetail(response);
      setDetailDialogOpen(true);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onSuspend = async (user) => {
    const reason = window.prompt('Askıya alma nedeni');
    if (!reason || !reason.trim()) {
      return;
    }

    try {
      setActionError('');
      await suspendUser(user.id, reason.trim());
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onBan = async (user) => {
    const reason = window.prompt('Yasaklama nedeni');
    if (!reason || !reason.trim()) {
      return;
    }

    try {
      setActionError('');
      await banUser(user.id, reason.trim());
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onActivate = async (user) => {
    try {
      setActionError('');
      await activateUser(user.id);
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onDelete = async (user) => {
    const confirmed = window.confirm(
      `${user.email || 'Bu kullanıcı'} soft-delete ile silinsin mi? Oturumları kapatılır ve listeden kalkar.`
    );
    if (!confirmed) {
      return;
    }

    try {
      setActionError('');
      setActionInfo('');
      await deleteUser(user.id);
      if (detail?.id === user.id) {
        setDetailDialogOpen(false);
        setDetail(null);
      }
      setActionInfo('Kullanıcı silindi.');
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onCreate = async () => {
    if (!createForm.email.trim() || !createForm.password || !createForm.firstName.trim() || !createForm.lastName.trim()) {
      setActionError('Ad, soyad, e-posta ve şifre zorunludur.');
      return;
    }

    if (createForm.role === 'DoorStaff' && !createForm.assignedEventId) {
      setActionError('Kapı personeli için etkinlik seçilmelidir.');
      return;
    }

    try {
      setCreating(true);
      setActionError('');
      setActionInfo('');
      await createUser({
        email: createForm.email.trim(),
        password: createForm.password,
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        phone: createForm.phone.trim() || null,
        role: createForm.role,
        gender: createForm.role === 'Customer' ? Number(createForm.gender) : undefined,
        assignedEventId: createForm.role === 'DoorStaff' ? createForm.assignedEventId : null
      });
      setCreateDialogOpen(false);
      setCreateForm(EMPTY_CREATE);
      setActionInfo('Kullanıcı oluşturuldu.');
      await refresh();
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <MainCard
        title="Kullanıcı Yönetimi"
        secondary={
          <Button variant="contained" onClick={() => setCreateDialogOpen(true)}>
            Kullanıcı Oluştur
          </Button>
        }
      >
        <Stack sx={{ gap: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2 }}>
            <TextField
              label="Ara"
              placeholder="Ad, e-posta"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              fullWidth
            />
            <TextField
              select
              label="Rol"
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Tüm Roller</MenuItem>
              <MenuItem value="Customer">Müşteri</MenuItem>
              <MenuItem value="DoorStaff">Kapı Personeli</MenuItem>
            </TextField>
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
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Suspended">Suspended</MenuItem>
              <MenuItem value="Banned">Banned</MenuItem>
            </TextField>
            <TextField
              select
              label="Misafir"
              value={isGuest}
              onChange={(event) => {
                setIsGuest(event.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">Tümü</MenuItem>
              <MenuItem value="false">Kayıtlı</MenuItem>
              <MenuItem value="true">Misafir</MenuItem>
            </TextField>
          </Stack>

          {error && <Alert severity="error">Kullanıcı listesi alınamadı.</Alert>}
          {actionError && <Alert severity="error">{actionError}</Alert>}
          {actionInfo && <Alert severity="success">{actionInfo}</Alert>}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Ad Soyad</TableCell>
                  <TableCell>E-posta</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Etkinlik</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Misafir</TableCell>
                  <TableCell>Oluşturulma</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Gösterilecek kullanıcı bulunamadı.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{field(user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim())}</TableCell>
                      <TableCell>{field(user.email)}</TableCell>
                      <TableCell>{roleLabel(user.role)}</TableCell>
                      <TableCell>
                        {user.role === 'DoorStaff'
                          ? field(eventTitleById.get(user.assignedEventId) || user.assignedEventId)
                          : '-'}
                      </TableCell>
                      <TableCell>{field(user.status)}</TableCell>
                      <TableCell>{user.isGuest ? 'Evet' : 'Hayır'}</TableCell>
                      <TableCell>{field(user.createdAtUtc || user.createdAt)}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => openDetail(user.id)}>
                          Detay
                        </Button>
                        <Button size="small" color="warning" onClick={() => onSuspend(user)}>
                          Askıya Al
                        </Button>
                        <Button size="small" color="error" onClick={() => onBan(user)}>
                          Yasakla
                        </Button>
                        <Button size="small" color="success" onClick={() => onActivate(user)}>
                          Aktifleştir
                        </Button>
                        <Button size="small" color="error" onClick={() => onDelete(user)}>
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

      <Dialog open={createDialogOpen} onClose={() => !creating && setCreateDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Kullanıcı Oluştur</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, mt: 1 }}>
            <Alert severity="info">Admin rolü buradan oluşturulamaz. Müşteri veya kapı personeli ekleyebilirsiniz.</Alert>
            <TextField
              select
              label="Rol"
              value={createForm.role}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  role: event.target.value,
                  assignedEventId: event.target.value === 'DoorStaff' ? prev.assignedEventId : ''
                }))
              }
              fullWidth
            >
              <MenuItem value="Customer">Müşteri (Customer)</MenuItem>
              <MenuItem value="DoorStaff">Kapı Personeli (DoorStaff)</MenuItem>
            </TextField>
            {createForm.role === 'DoorStaff' ? (
              <TextField
                select
                label="Atanan Etkinlik"
                value={createForm.assignedEventId}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, assignedEventId: event.target.value }))}
                helperText="Bu kapı personeli yalnızca seçilen etkinlikte bilet tarayabilir."
                fullWidth
                required
              >
                <MenuItem value="">Etkinlik seçin</MenuItem>
                {(eventOptions || []).map((event) => (
                  <MenuItem key={event.id} value={event.id}>
                    {event.title || event.name || event.slug || event.id}
                    {event.status ? ` (${event.status})` : ''}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
              <TextField
                label="Ad"
                value={createForm.firstName}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, firstName: event.target.value }))}
                fullWidth
                required
              />
              <TextField
                label="Soyad"
                value={createForm.lastName}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, lastName: event.target.value }))}
                fullWidth
                required
              />
            </Stack>
            <TextField
              label="E-posta"
              type="email"
              value={createForm.email}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Telefon"
              value={createForm.phone}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: event.target.value }))}
              fullWidth
            />
            {createForm.role === 'Customer' ? (
              <TextField
                select
                label="Cinsiyet"
                value={createForm.gender}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, gender: Number(event.target.value) }))}
                fullWidth
              >
                <MenuItem value={1}>Kadın</MenuItem>
                <MenuItem value={2}>Erkek</MenuItem>
                <MenuItem value={3}>Belirtmek İstemiyorum</MenuItem>
              </TextField>
            ) : null}
            <TextField
              label="Şifre"
              type="password"
              value={createForm.password}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
              helperText="En az 8 karakter; büyük harf, küçük harf ve rakam"
              fullWidth
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={creating}>
            İptal
          </Button>
          <Button variant="contained" onClick={onCreate} disabled={creating}>
            {creating ? 'Oluşturuluyor...' : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Kullanıcı Detayı</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 1.25, mt: 1 }}>
            <Typography>Ad Soyad: {field(detail?.fullName || `${detail?.firstName || ''} ${detail?.lastName || ''}`.trim())}</Typography>
            <Typography>E-posta: {field(detail?.email)}</Typography>
            <Typography>Rol: {roleLabel(detail?.role)}</Typography>
            {detail?.role === 'DoorStaff' ? (
              <Typography>
                Atanan Etkinlik:{' '}
                {field(eventTitleById.get(detail?.assignedEventId) || detail?.assignedEventId)}
              </Typography>
            ) : null}
            <Typography>Durum: {field(detail?.status)}</Typography>
            <Typography>Misafir: {detail?.isGuest ? 'Evet' : 'Hayır'}</Typography>
            <Typography>Oluşturulma: {field(detail?.createdAtUtc || detail?.createdAt)}</Typography>
            <Typography>Askı Nedeni: {field(detail?.suspendReason || detail?.suspensionReason)}</Typography>
            <Typography>Yasak Nedeni: {field(detail?.banReason)}</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          {detail?.id && (
            <>
              <Button color="warning" onClick={() => onSuspend(detail)}>
                Askıya Al
              </Button>
              <Button color="error" onClick={() => onBan(detail)}>
                Yasakla
              </Button>
              <Button color="success" onClick={() => onActivate(detail)}>
                Aktifleştir
              </Button>
              <Button color="error" onClick={() => onDelete(detail)}>
                Sil
              </Button>
            </>
          )}
          <Button onClick={() => setDetailDialogOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
