import { ReadOutlined, TagsOutlined, AppstoreOutlined } from '@ant-design/icons';

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
    },
    {
      id: 'blog-categories',
      title: 'Blog Kategorileri',
      type: 'item',
      url: '/blog/categories',
      icon: AppstoreOutlined
    },
    {
      id: 'blog-tags',
      title: 'Blog Etiketleri',
      type: 'item',
      url: '/blog/tags',
      icon: TagsOutlined
    }
  ]
};

export default blogMenu;
