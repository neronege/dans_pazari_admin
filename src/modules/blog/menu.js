import { ReadOutlined } from '@ant-design/icons';

const blogMenu = {
  id: 'group-blog',
  title: 'Blog',
  type: 'group',
  requiredRoles: ['Admin'],
  children: [
    {
      id: 'blog',
      title: 'Blog Yazıları',
      type: 'item',
      url: '/blog',
      icon: ReadOutlined
    }
  ]
};

export default blogMenu;
