'use client';

import { useState } from 'react';

// material-ui
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

// project imports
import MainCard from 'components/MainCard';
import OrdersTable from 'sections/dashboard/default/OrdersTable';
import DashboardSummaryCards from 'modules/dashboard/ui/DashboardSummaryCards';
import DashboardIncomeOverviewCard from 'modules/dashboard/ui/DashboardIncomeOverviewCard';
import DashboardPerformanceCard from 'modules/dashboard/ui/DashboardPerformanceCard';
import DashboardSalesTrendCard from 'modules/dashboard/ui/DashboardSalesTrendCard';
import DashboardTransactionHistory from 'modules/dashboard/ui/DashboardTransactionHistory';

// assets
import EllipsisOutlined from '@ant-design/icons/EllipsisOutlined';

// ==============================|| DASHBOARD - DEFAULT ||============================== //

export default function DashboardDefault() {
  const [orderMenuAnchor, setOrderMenuAnchor] = useState(null);

  const handleOrderMenuClick = (event) => {
    setOrderMenuAnchor(event.currentTarget);
  };
  const handleOrderMenuClose = () => {
    setOrderMenuAnchor(null);
  };

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* row 1 */}
      <Grid sx={{ mb: -2.25 }} size={12}>
        <Typography variant="h5">Panel</Typography>
      </Grid>
      <DashboardSummaryCards />
      <Grid sx={{ display: { sm: 'none', md: 'block', lg: 'none' } }} size={{ md: 8 }} />

      {/* row 2 */}
      <DashboardSalesTrendCard />
      <DashboardIncomeOverviewCard />

      {/* row 3 */}
      <Grid size={{ xs: 12, md: 7, lg: 8 }}>
        <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Grid>
            <Typography variant="h5">Son Siparisler</Typography>
          </Grid>
          <Grid>
            <IconButton onClick={handleOrderMenuClick}>
              <EllipsisOutlined style={{ fontSize: '1.25rem' }} />
            </IconButton>
            <Menu
              id="fade-menu"
              slotProps={{ list: { 'aria-labelledby': 'fade-button' } }}
              anchorEl={orderMenuAnchor}
              onClose={handleOrderMenuClose}
              open={Boolean(orderMenuAnchor)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={handleOrderMenuClose}>CSV Olarak Dışa Aktar</MenuItem>
              <MenuItem onClick={handleOrderMenuClose}>Excel Olarak Dışa Aktar</MenuItem>
              <MenuItem onClick={handleOrderMenuClose}>Tabloyu Yazdır</MenuItem>
            </Menu>
          </Grid>
        </Grid>
        <MainCard sx={{ mt: 2 }} content={false}>
          <OrdersTable />
        </MainCard>
      </Grid>
      <DashboardPerformanceCard />

      {/* row 4 */}
      <Grid size={{ xs: 12, md: 7, lg: 8 }}>
        <MainCard sx={{ mt: 2 }}>
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            Canli panel, API kaynakli veriler ile guncellenmektedir.
          </Typography>
        </MainCard>
      </Grid>
      <DashboardTransactionHistory />
    </Grid>
  );
}
