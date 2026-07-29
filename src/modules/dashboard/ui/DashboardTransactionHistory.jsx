'use client';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MainCard from 'components/MainCard';
import GiftOutlined from '@ant-design/icons/GiftOutlined';
import useRecentOrders from 'modules/orders/hooks/useRecentOrders';

const avatarSX = {
  width: 36,
  height: 36,
  fontSize: '1rem'
};

const actionSX = {
  mt: 0.75,
  ml: 1,
  top: 'auto',
  right: 'auto',
  alignSelf: 'flex-start',
  transform: 'none'
};

function formatAmount(value, currency) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency || 'TRY',
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

export default function DashboardTransactionHistory() {
  const { orders, isLoading, error, retry } = useRecentOrders();
  const topOrders = orders.slice(0, 3);

  return (
    <Grid size={{ xs: 12, md: 5, lg: 4 }}>
      <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Grid>
          <Typography variant="h5">Islem Gecmisi</Typography>
        </Grid>
      </Grid>
      <MainCard sx={{ mt: 2 }} content={false}>
        {error && (
          <Alert
            severity="error"
            sx={{ m: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => retry()}>
                Tekrar Dene
              </Button>
            }
          >
            Islem gecmisi alinamadi.
          </Alert>
        )}

        {!error && isLoading && (
          <Typography sx={{ px: 2, py: 3, color: 'text.secondary' }} variant="body2">
            Yukleniyor...
          </Typography>
        )}

        {!error && !isLoading && topOrders.length === 0 && (
          <Typography sx={{ px: 2, py: 3, color: 'text.secondary' }} variant="body2">
            Gosterilecek islem bulunamadi.
          </Typography>
        )}

        {!error && !isLoading && topOrders.length > 0 && (
          <List
            component="nav"
            sx={{
              px: 0,
              py: 0,
              '& .MuiListItemButton-root': {
                py: 1.5,
                px: 2,
                '& .MuiAvatar-root': avatarSX,
                '& .MuiListItemSecondaryAction-root': { ...actionSX, position: 'relative' }
              }
            }}
          >
            {topOrders.map((order, index) => (
              <ListItem
                key={order.id || order.orderNumber || index}
                component={ListItemButton}
                divider={index < topOrders.length - 1}
                secondaryAction={
                  <Stack sx={{ alignItems: 'flex-end' }}>
                    <Typography variant="subtitle1" noWrap>
                      {formatAmount(order.totalAmount, order.currency)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'secondary.main' }} noWrap>
                      {order.status || 'Bilinmiyor'}
                    </Typography>
                  </Stack>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ color: 'success.main', bgcolor: 'success.lighter' }}>
                    <GiftOutlined />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography variant="subtitle1">Siparis #{order.orderNumber || '-'}</Typography>}
                  secondary={order.buyerEmail || 'E-posta yok'}
                />
              </ListItem>
            ))}
          </List>
        )}
      </MainCard>
    </Grid>
  );
}
