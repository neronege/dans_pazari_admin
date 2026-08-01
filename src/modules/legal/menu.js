import { FileProtectOutlined } from '@ant-design/icons';

const legalMenu = {
  id: 'group-legal',
  title: 'İçerik',
  type: 'group',
  requiredRoles: ['Admin'],
  children: [
    {
      id: 'legal',
      title: 'Yasal Sayfalar',
      type: 'item',
      url: '/legal',
      icon: FileProtectOutlined
    }
  ]
};

export default legalMenu;
