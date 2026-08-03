import { FileProtectOutlined, QuestionCircleOutlined } from '@ant-design/icons';

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
    },
    {
      id: 'faq',
      title: 'SSS (FAQ)',
      type: 'item',
      url: '/faq',
      icon: QuestionCircleOutlined
    }
  ]
};

export default legalMenu;
