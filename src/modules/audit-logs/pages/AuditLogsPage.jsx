'use client';

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
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
import { getAuditLogDetail } from 'modules/audit-logs/api/auditLogs.service';
import useAuditLogs from 'modules/audit-logs/hooks/useAuditLogs';
import { getHumanReadableError } from 'shared/api';

function toIsoStart(dateValue) {
  if (!dateValue) {
    return '';
  }

  return new Date(`${dateValue}T00:00:00`).toISOString();
}

function toIsoEnd(dateValue) {
  if (!dateValue) {
    return '';
  }

  return new Date(`${dateValue}T23:59:59`).toISOString();
}

function field(value, fallback = '-') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return value;
}

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [actionError, setActionError] = useState('');

  const fromUtc = toIsoStart(fromDate);
  const toUtc = toIsoEnd(toDate);

  const { logs, totalCount, isLoading, error } = useAuditLogs({
    page,
    pageSize: 20,
    search,
    action,
    entityType,
    fromUtc,
    toUtc
  });

  const pageCount = Math.max(1, Math.ceil(totalCount / 20));

  const openDetail = async (auditLogId) => {
    try {
      setActionError('');
      const response = await getAuditLogDetail(auditLogId);
      setDetail(response);
      setDetailDialogOpen(true);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  return (
    <>
      <MainCard title="Denetim Kayıtları">
        <Stack sx={{ gap: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2 }}>
            <TextField
              label="Ara"
              placeholder="Kullanıcı, işlem, varlık"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              fullWidth
            />
            <TextField
              label="Aksiyon"
              value={action}
              onChange={(event) => {
                setAction(event.target.value);
                setPage(1);
              }}
            />
            <TextField
              label="Varlık Tipi"
              value={entityType}
              onChange={(event) => {
                setEntityType(event.target.value);
                setPage(1);
              }}
            />
            <TextField
              type="date"
              label="Başlangıç"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              label="Bitiş"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          {error && <Alert severity="error">Denetim kayıtları alınamadı.</Alert>}
          {actionError && <Alert severity="error">{actionError}</Alert>}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tarih</TableCell>
                  <TableCell>Kullanıcı</TableCell>
                  <TableCell>İşlem</TableCell>
                  <TableCell>Varlık</TableCell>
                  <TableCell>Varlık ID</TableCell>
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

                {!isLoading && logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Gösterilecek kayıt bulunamadı.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  logs.map((log, index) => (
                    <TableRow key={log.id || index} hover>
                      <TableCell>{field(log.occurredAtUtc || log.createdAtUtc || log.createdAt)}</TableCell>
                      <TableCell>{field(log.actorName || log.actorEmail || log.userEmail)}</TableCell>
                      <TableCell>{field(log.action || log.actionType)}</TableCell>
                      <TableCell>{field(log.entityType)}</TableCell>
                      <TableCell>{field(log.entityId)}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => openDetail(log.id)}>
                          Detay
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
        <DialogTitle>Denetim Kayıt Detayı</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 1.25, mt: 1 }}>
            <Typography>Tarih: {field(detail?.occurredAtUtc || detail?.createdAtUtc || detail?.createdAt)}</Typography>
            <Typography>Kullanıcı: {field(detail?.actorName || detail?.actorEmail || detail?.userEmail)}</Typography>
            <Typography>İşlem: {field(detail?.action || detail?.actionType)}</Typography>
            <Typography>Varlık Tipi: {field(detail?.entityType)}</Typography>
            <Typography>Varlık ID: {field(detail?.entityId)}</Typography>
            <Typography>IP: {field(detail?.ipAddress || detail?.clientIp)}</Typography>
            <Typography>User Agent: {field(detail?.userAgent)}</Typography>
            <Typography>Özet: {field(detail?.summary || detail?.message)}</Typography>

            <TextField
              label="Ham İçerik"
              value={JSON.stringify(detail || {}, null, 2)}
              multiline
              minRows={10}
              InputProps={{ readOnly: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
