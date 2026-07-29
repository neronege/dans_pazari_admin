import { DashboardOutlined } from '@ant-design/icons';

const dashboardMenu = {
  id: 'group-dashboard',
  title: 'Genel',
  type: 'group',
  requiredRoles: ['Admin'],
  children: [
    {
      id: 'dashboard-default',
      title: 'Panel Ozeti',
      type: 'item',
      url: '/dashboard/default',
      icon: DashboardOutlined,
      breadcrumbs: false
    }
  ]
};

export default dashboardMenu;
