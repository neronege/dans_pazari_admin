import { TeamOutlined } from '@ant-design/icons';

const usersMenu = {
  id: 'group-users',
  title: 'Kullanıcılar',
  type: 'group',
  requiredRoles: ['Admin'],
  children: [
    {
      id: 'users',
      title: 'Kullanıcı Yönetimi',
      type: 'item',
      url: '/users',
      icon: TeamOutlined
    }
  ]
};

export default usersMenu;
