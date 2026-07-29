import { TrophyOutlined } from '@ant-design/icons';

const rafflesMenu = {
  id: 'group-raffles',
  title: 'Çekilişler',
  type: 'group',
  requiredRoles: ['Admin'],
  children: [
    {
      id: 'raffles',
      title: 'Çekiliş Yönetimi',
      type: 'item',
      url: '/raffles',
      icon: TrophyOutlined
    }
  ]
};

export default rafflesMenu;
