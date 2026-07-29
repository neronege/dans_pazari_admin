import { CalendarOutlined, FolderOutlined, EnvironmentOutlined } from '@ant-design/icons';

const catalogMenu = {
  id: 'group-catalog',
  title: 'Katalog',
  type: 'group',
  requiredRoles: ['Admin'],
  children: [
    {
      id: 'categories',
      title: 'Kategoriler',
      type: 'item',
      url: '/categories',
      icon: FolderOutlined
    },
    {
      id: 'venues',
      title: 'Mekanlar',
      type: 'item',
      url: '/venues',
      icon: EnvironmentOutlined
    },
    {
      id: 'events',
      title: 'Etkinlikler',
      type: 'item',
      url: '/events',
      icon: CalendarOutlined
    }
  ]
};

export default catalogMenu;
