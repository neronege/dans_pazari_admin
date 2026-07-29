'use client';

import useSWR from 'swr';
import { getCategories } from 'modules/categories/api/categories.service';

const categoriesKey = 'admin/categories';
const EMPTY_CATEGORIES = [];

export default function useCategories() {
  const { data, error, isLoading, mutate } = useSWR(categoriesKey, getCategories, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });

  return {
    categories: data || EMPTY_CATEGORIES,
    isLoading,
    error,
    refresh: mutate
  };
}
