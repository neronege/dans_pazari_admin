'use client';

import { useState } from 'react';
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
import { activateUser, banUser, getUserDetail, suspendUser } from 'modules/users/api/users.service';
import useUsers from 'modules/users/hooks/useUsers';
import { getHumanReadableError } from 'shared/api';

function field(value, fallback = '-') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return value;
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [isGuest, setIsGuest] = useState('');
  const [page, setPage] = useState(1);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [actionError, setActionError] = useState('');

  const { users, totalCount, isLoading, error, refresh } = useUsers({
    page,
    pageSize: 20,
    search,
    status,
    isGuest
  });

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

  return (
    <>
      <MainCard title="Kullanıcı Yönetimi">
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

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Ad Soyad</TableCell>
                  <TableCell>E-posta</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Misafir</TableCell>
                  <TableCell>Oluşturulma</TableCell>
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

                {!isLoading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Gösterilecek kullanıcı bulunamadı.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{field(user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim())}</TableCell>
                      <TableCell>{field(user.email)}</TableCell>
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

      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Kullanıcı Detayı</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 1.25, mt: 1 }}>
            <Typography>Ad Soyad: {field(detail?.fullName || `${detail?.firstName || ''} ${detail?.lastName || ''}`.trim())}</Typography>
            <Typography>E-posta: {field(detail?.email)}</Typography>
            <Typography>Durum: {field(detail?.status)}</Typography>
            <Typography>Misafir: {detail?.isGuest ? 'Evet' : 'Hayır'}</Typography>
            <Typography>Oluşturulma: {field(detail?.createdAtUtc || detail?.createdAt)}</Typography>
            <Typography>Askı Nedeni: {field(detail?.suspendReason)}</Typography>
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
            </>
          )}
          <Button onClick={() => setDetailDialogOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
