import { ShoppingCartOutlined, RedoOutlined, BarChartOutlined, FileSearchOutlined, QrcodeOutlined } from '@ant-design/icons';

const operationsMenu = {
  id: 'group-operations',
  title: 'Operasyon',
  type: 'group',
  requiredRoles: ['Admin', 'DoorStaff'],
  children: [
    {
      id: 'orders',
      title: 'Siparişler',
      type: 'item',
      url: '/orders',
      icon: ShoppingCartOutlined,
      requiredRoles: ['Admin']
    },
    {
      id: 'tickets',
      title: 'Kapı Tarama',
      type: 'item',
      url: '/tickets',
      icon: QrcodeOutlined,
      requiredRoles: ['Admin', 'DoorStaff']
    },
    {
      id: 'tickets-monitor',
      title: 'Kapı Monitörü',
      type: 'item',
      url: '/tickets/monitor',
      icon: QrcodeOutlined,
      requiredRoles: ['Admin', 'DoorStaff']
    },
    {
      id: 'refunds',
      title: 'İadeler',
      type: 'item',
      url: '/refunds',
      icon: RedoOutlined,
      requiredRoles: ['Admin']
    },
    {
      id: 'support',
      title: 'Destek Gelen Kutusu',
      type: 'item',
      url: '/support',
      icon: FileSearchOutlined,
      requiredRoles: ['Admin']
    },
    {
      id: 'reports',
      title: 'Raporlar',
      type: 'item',
      url: '/reports',
      icon: BarChartOutlined,
      requiredRoles: ['Admin']
    },
    {
      id: 'audit-logs',
      title: 'Denetim Kayıtları',
      type: 'item',
      url: '/audit-logs',
      icon: FileSearchOutlined,
      requiredRoles: ['Admin']
    }
  ]
};

export default operationsMenu;
