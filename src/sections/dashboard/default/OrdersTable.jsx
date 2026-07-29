'use client';

import PropTypes from 'prop-types';
// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import Dot from 'components/@extended/Dot';
import { NumericFormat } from 'components/third-party';
import useRecentOrders from 'modules/orders/hooks/useRecentOrders';

function formatOrderStatus(status) {
  const statusKey = String(status || '').toLowerCase();

  switch (statusKey) {
    case 'paid':
    case 'completed':
    case '1':
      return { color: 'success', label: 'Odendi' };
    case 'pending':
    case '0':
      return { color: 'warning', label: 'Beklemede' };
    case 'partiallyrefunded':
      return { color: 'warning', label: 'Kismen iade' };
    case 'refunded':
      return { color: 'info', label: 'Iade edildi' };
    case 'cancelled':
      return { color: 'error', label: 'Iptal edildi' };
    case 'failed':
    case 'rejected':
    case '2':
      return { color: 'error', label: 'Basarisiz' };
    default:
      return { color: 'secondary', label: status || 'Bilinmiyor' };
  }
}

const headCells = [
  {
    id: 'orderNumber',
    align: 'left',
    disablePadding: false,
    label: 'Siparis No'
  },
  {
    id: 'buyerEmail',
    align: 'left',
    disablePadding: true,
    label: 'Musteri E-Posta'
  },
  {
    id: 'ticketCount',
    align: 'right',
    disablePadding: false,
    label: 'Bilet'
  },
  {
    id: 'status',
    align: 'left',
    disablePadding: false,
    label: 'Durum'
  },
  {
    id: 'totalAmount',
    align: 'right',
    disablePadding: false,
    label: 'Toplam Tutar'
  }
];

// ==============================|| ORDER TABLE - HEADER ||============================== //

function OrderTableHead() {
  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell key={headCell.id} align={headCell.align} padding={headCell.disablePadding ? 'none' : 'normal'}>
            {headCell.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

function OrderStatus({ status }) {
  const normalized = formatOrderStatus(status);

  return (
    <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
      <Dot color={normalized.color} />
      <Typography>{normalized.label}</Typography>
    </Stack>
  );
}

// ==============================|| ORDER TABLE ||============================== //

export default function OrderTable() {
  const { orders, isLoading, error, retry } = useRecentOrders();

  return (
    <Box>
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, mx: 2, mt: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => retry()}>
              Tekrar Dene
            </Button>
          }
        >
          Siparis listesi alinamadi.
        </Alert>
      )}
      <TableContainer
        sx={{
          width: '100%',
          overflowX: 'auto',
          position: 'relative',
          display: 'block',
          maxWidth: '100%',
          '& td, & th': { whiteSpace: 'nowrap' }
        }}
      >
        <Table aria-labelledby="tableTitle">
          <OrderTableHead />
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Yukleniyor...
                </TableCell>
              </TableRow>
            )}

            {!isLoading && orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Gosterilecek siparis bulunamadi.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              orders.map((row, index) => {
                const labelId = `enhanced-table-checkbox-${index}`;
                const currency = row.currency || 'TRY';

                return (
                  <TableRow
                    hover
                    role="checkbox"
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    tabIndex={-1}
                    key={row.id || row.orderNumber || index}
                  >
                    <TableCell component="th" id={labelId} scope="row">
                      <Link sx={{ color: 'secondary.main' }}>{row.orderNumber || '-'}</Link>
                    </TableCell>
                    <TableCell>{row.buyerEmail || '-'}</TableCell>
                    <TableCell align="right">{row.ticketCount ?? '-'}</TableCell>
                    <TableCell>
                      <OrderStatus status={row.status} />
                    </TableCell>
                    <TableCell align="right">
                      <NumericFormat value={row.totalAmount || 0} displayType="text" thousandSeparator suffix={` ${currency}`} />
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

OrderTableHead.propTypes = {};

OrderStatus.propTypes = { status: PropTypes.oneOfType([PropTypes.number, PropTypes.string]) };
