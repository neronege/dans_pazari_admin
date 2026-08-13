import { FileProtectOutlined, QuestionCircleOutlined, FormOutlined } from '@ant-design/icons';

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
    },
    {
      id: 'polls',
      title: 'Anketler',
      type: 'item',
      url: '/polls',
      icon: FormOutlined
    }
  ]
};

export default legalMenu;
