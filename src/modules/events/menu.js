import {
  CalendarOutlined,
  FolderOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  SoundOutlined,
  BankOutlined
} from '@ant-design/icons';

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
    },
    {
      id: 'organizers',
      title: 'Organizatörler',
      type: 'item',
      url: '/organizers',
      icon: TeamOutlined
    },
    {
      id: 'dance-schools',
      title: 'Dans Okulları',
      type: 'item',
      url: '/dance-schools',
      icon: BankOutlined
    },
    {
      id: 'promoters',
      title: 'Promotörler',
      type: 'item',
      url: '/promoters',
      icon: SoundOutlined
    }
  ]
};

export default catalogMenu;
