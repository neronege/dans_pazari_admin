'use client';

import useSWR from 'swr';
import { getBlogCategories, getBlogPosts, getBlogTags } from 'modules/blog/api/blog.service';

const EMPTY_LIST = [];

export default function useBlogPosts(filters = {}) {
  const page = Number(filters.page || 1);
  const pageSize = Number(filters.pageSize || 20);
  const search = filters.search || '';
  const status = filters.status || '';
  const categoryId = filters.categoryId || '';

  const postsKey = ['admin/blog/posts', page, pageSize, search, status, categoryId];

  const { data, error, isLoading, mutate } = useSWR(
    postsKey,
    ([, currentPage, currentPageSize, currentSearch, currentStatus, currentCategoryId]) =>
      getBlogPosts({
        page: currentPage,
        pageSize: currentPageSize,
        search: currentSearch || undefined,
        status: currentStatus || undefined,
        categoryId: currentCategoryId || undefined
      }),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }
  );

  const { data: categoriesData, mutate: mutateCategories } = useSWR('admin/blog/categories', getBlogCategories, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });

  const { data: tagsData, mutate: mutateTags } = useSWR('admin/blog/tags', getBlogTags, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });

  return {
    posts: data?.items || EMPTY_LIST,
    page: data?.page || page,
    pageSize: data?.pageSize || pageSize,
    totalCount: data?.totalCount || 0,
    categories: categoriesData || EMPTY_LIST,
    tags: tagsData || EMPTY_LIST,
    isLoading,
    error,
    refresh: () => mutate(),
    refreshTaxonomy: () => Promise.all([mutateCategories(), mutateTags()])
  };
}
