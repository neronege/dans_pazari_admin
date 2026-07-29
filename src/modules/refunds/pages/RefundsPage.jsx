'use client';

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
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
import { approveRefundRequest, getRefundRequestDetail, rejectRefundRequest } from 'modules/refunds/api/refunds.service';
import useRefunds from 'modules/refunds/hooks/useRefunds';
import { getHumanReadableError } from 'shared/api';

function field(value, fallback = '-') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return value;
}

export default function RefundsPage() {
  const [status, setStatus] = useState('');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [actionError, setActionError] = useState('');

  const { refunds, isLoading, error, refresh } = useRefunds({ status, take: 50 });

  const openDetail = async (refundRequestId) => {
    try {
      setActionError('');
      const response = await getRefundRequestDetail(refundRequestId);
      setDetail(response);
      setDetailDialogOpen(true);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onApprove = async (refundRequest) => {
    const approvedAmountInput = window.prompt(
      'Onaylanacak tutar (boş bırakırsanız talep tutarı kullanılır)',
      String(refundRequest.amount ?? '')
    );
    const reviewNote = window.prompt('İnceleme notu (opsiyonel)') || '';

    if (approvedAmountInput !== null && approvedAmountInput !== '' && Number.isNaN(Number(approvedAmountInput))) {
      return;
    }

    try {
      setActionError('');
      await approveRefundRequest(refundRequest.id, {
        approvedAmount: approvedAmountInput ? Number(approvedAmountInput) : undefined,
        reviewNote: reviewNote.trim() || undefined
      });
      await refresh();

      if (detailDialogOpen && detail?.id === refundRequest.id) {
        const updated = await getRefundRequestDetail(refundRequest.id);
        setDetail(updated);
      }
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onReject = async (refundRequest) => {
    const reviewNote = window.prompt('Reddetme notu (zorunlu)');
    if (!reviewNote || !reviewNote.trim()) {
      return;
    }

    try {
      setActionError('');
      await rejectRefundRequest(refundRequest.id, {
        reviewNote: reviewNote.trim()
      });
      await refresh();

      if (detailDialogOpen && detail?.id === refundRequest.id) {
        const updated = await getRefundRequestDetail(refundRequest.id);
        setDetail(updated);
      }
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  return (
    <>
      <MainCard title="İade Talepleri">
        <Stack sx={{ gap: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
            <TextField select label="Durum" value={status} onChange={(event) => setStatus(event.target.value)} sx={{ minWidth: 260 }}>
              <MenuItem value="">Tüm Durumlar</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Failed">Failed</MenuItem>
            </TextField>
          </Stack>

          {error && <Alert severity="error">İade listesi alınamadı.</Alert>}
          {actionError && <Alert severity="error">{actionError}</Alert>}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Talep No</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Tutar</TableCell>
                  <TableCell>Neden</TableCell>
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

                {!isLoading && refunds.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Gösterilecek iade talebi bulunamadı.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  refunds.map((refundRequest, index) => (
                    <TableRow key={refundRequest.id || index} hover>
                      <TableCell>{field(refundRequest.requestNumber || refundRequest.id)}</TableCell>
                      <TableCell>{field(refundRequest.status)}</TableCell>
                      <TableCell>{field(refundRequest.amount ?? refundRequest.requestedAmount)}</TableCell>
                      <TableCell>{field(refundRequest.reason || refundRequest.reviewNote)}</TableCell>
                      <TableCell>{field(refundRequest.createdAtUtc || refundRequest.createdAt)}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => openDetail(refundRequest.id)}>
                          Detay
                        </Button>
                        <Button size="small" color="success" onClick={() => onApprove(refundRequest)}>
                          Onayla
                        </Button>
                        <Button size="small" color="warning" onClick={() => onReject(refundRequest)}>
                          Reddet
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </MainCard>

      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>İade Talep Detayı</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 1.25, mt: 1 }}>
            <Typography>Talep No: {field(detail?.requestNumber || detail?.id)}</Typography>
            <Typography>Durum: {field(detail?.status)}</Typography>
            <Typography>Tutar: {field(detail?.amount ?? detail?.requestedAmount)}</Typography>
            <Typography>Onaylanan Tutar: {field(detail?.approvedAmount)}</Typography>
            <Typography>Neden: {field(detail?.reason)}</Typography>
            <Typography>İnceleme Notu: {field(detail?.reviewNote)}</Typography>
            <Typography>İstek Tarihi: {field(detail?.createdAtUtc || detail?.createdAt)}</Typography>
            <Typography>Sipariş No: {field(detail?.orderNumber)}</Typography>
            <Typography>Bilet No: {field(detail?.ticketNumber)}</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          {detail?.id && (
            <>
              <Button color="success" onClick={() => onApprove(detail)}>
                Onayla
              </Button>
              <Button color="warning" onClick={() => onReject(detail)}>
                Reddet
              </Button>
            </>
          )}
          <Button onClick={() => setDetailDialogOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
