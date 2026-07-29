import { ShoppingCartOutlined, RedoOutlined, BarChartOutlined, FileSearchOutlined, QrcodeOutlined } from '@ant-design/icons';

const operationsMenu = {
  id: 'group-operations',
  title: 'Operasyon',
  type: 'group',
  requiredRoles: ['Admin'],
  children: [
    {
      id: 'orders',
      title: 'Siparişler',
      type: 'item',
      url: '/orders',
      icon: ShoppingCartOutlined
    },
    {
      id: 'tickets',
      title: 'Bilet Tarama',
      type: 'item',
      url: '/tickets',
      icon: QrcodeOutlined
    },
    {
      id: 'refunds',
      title: 'İadeler',
      type: 'item',
      url: '/refunds',
      icon: RedoOutlined
    },
    {
      id: 'reports',
      title: 'Raporlar',
      type: 'item',
      url: '/reports',
      icon: BarChartOutlined
    },
    {
      id: 'audit-logs',
      title: 'Denetim Kayıtları',
      type: 'item',
      url: '/audit-logs',
      icon: FileSearchOutlined
    }
  ]
};

export default operationsMenu;
