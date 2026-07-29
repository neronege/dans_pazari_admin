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
import Pagination from '@mui/material/Pagination';
import { fulfillOrderPayment, getOrderDetail } from 'modules/orders/api/orders.service';
import useOrders from 'modules/orders/hooks/useOrders';
import { getHumanReadableError } from 'shared/api';

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [actionError, setActionError] = useState('');

  const { orders, totalCount, isLoading, error, refresh } = useOrders({
    page,
    pageSize,
    search,
    status
  });

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  const openDetail = async (orderId) => {
    try {
      setActionError('');
      const response = await getOrderDetail(orderId);
      setDetail(response);
      setDetailDialogOpen(true);
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  const onFulfillPayment = async (orderId) => {
    const confirmed = window.confirm('Bu siparişin ödemesini manuel tamamlamak istiyor musunuz?');
    if (!confirmed) {
      return;
    }

    try {
      setActionError('');
      const result = await fulfillOrderPayment(orderId);
      window.alert(`İşlem tamamlandı. Sipariş: ${result?.orderNumber || '-'}, Bilet: ${result?.ticketCount ?? 0}`);
      await refresh();

      if (detailDialogOpen && detail?.id === orderId) {
        const updated = await getOrderDetail(orderId);
        setDetail(updated);
      }
    } catch (requestError) {
      setActionError(getHumanReadableError(requestError?.problem) || requestError?.message);
    }
  };

  return (
    <>
      <MainCard title="Sipariş Yönetimi">
        <Stack sx={{ gap: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
            <TextField
              label="Ara"
              placeholder="Sipariş no, e-posta veya ad"
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
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">Tüm Durumlar</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
              <MenuItem value="Refunded">Refunded</MenuItem>
            </TextField>
          </Stack>

          {error && <Alert severity="error">Sipariş listesi alınamadı.</Alert>}
          {actionError && <Alert severity="error">{actionError}</Alert>}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Sipariş No</TableCell>
                  <TableCell>Müşteri</TableCell>
                  <TableCell>Tutar</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Bilet</TableCell>
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

                {!isLoading && orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Gösterilecek sipariş bulunamadı.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  orders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>{order.orderNumber || '-'}</TableCell>
                      <TableCell>{order.buyerEmail || order.customerEmail || '-'}</TableCell>
                      <TableCell>{order.totalAmount ?? '-'}</TableCell>
                      <TableCell>{order.status || '-'}</TableCell>
                      <TableCell>{order.ticketCount ?? '-'}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => openDetail(order.id)}>
                          Detay
                        </Button>
                        <Button size="small" color="secondary" onClick={() => onFulfillPayment(order.id)}>
                          Ödemeyi Tamamla
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
        <DialogTitle>Sipariş Detayı</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 1.5, mt: 1 }}>
            <Typography>Sipariş No: {detail?.orderNumber || '-'}</Typography>
            <Typography>Durum: {detail?.status || '-'}</Typography>
            <Typography>Müşteri E-posta: {detail?.buyerEmail || detail?.customerEmail || '-'}</Typography>
            <Typography>Toplam Tutar: {detail?.totalAmount ?? '-'}</Typography>
            <Typography>Bilet Adedi: {detail?.ticketCount ?? detail?.tickets?.length ?? 0}</Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Kalem</TableCell>
                    <TableCell>Adet</TableCell>
                    <TableCell>Birim Fiyat</TableCell>
                    <TableCell>Tutar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(detail?.items || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        Kalem bulunamadı.
                      </TableCell>
                    </TableRow>
                  )}

                  {(detail?.items || []).map((item) => (
                    <TableRow key={item.id || `${item.ticketTypeName}-${item.quantity}`}>
                      <TableCell>{item.ticketTypeName || item.name || '-'}</TableCell>
                      <TableCell>{item.quantity ?? '-'}</TableCell>
                      <TableCell>{item.unitPrice ?? '-'}</TableCell>
                      <TableCell>{item.totalAmount ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </DialogContent>
        <DialogActions>
          {detail?.id && (
            <Button color="secondary" onClick={() => onFulfillPayment(detail.id)}>
              Ödemeyi Tamamla
            </Button>
          )}
          <Button onClick={() => setDetailDialogOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
