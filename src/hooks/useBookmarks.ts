import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import type { Bookmark, BookmarkPayload } from '../types';
import { readMigratedStorageItem, writeStorageItem } from '../utils/localStorage';

const CACHE_KEY = 'cache';

interface CachedData {
  bookmarks: Bookmark[];
  categories: string[];
  ts: number;
}

function readCache(): CachedData | null {
  try {
    const raw = readMigratedStorageItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedData;
  } catch {
    return null;
  }
}

function writeCache(bookmarks: Bookmark[], categories: string[]) {
  try {
    writeStorageItem(
      CACHE_KEY,
      JSON.stringify({ bookmarks, categories, ts: Date.now() } satisfies CachedData)
    );
  } catch {
    // quota exceeded, ignore
  }
}

function stableStringify(value: unknown) {
  return JSON.stringify(value);
}

interface UseBookmarksOptions {
  token: string | null;
  search: string;
  category: string;
}

export function useBookmarks({ token, search, category }: UseBookmarksOptions) {
  const cached = useMemo(() => readCache(), []);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(cached?.bookmarks ?? []);
  const [categories, setCategories] = useState<string[]>(cached?.categories ?? []);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(Boolean(cached));
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastError, setLastError] = useState<unknown>(null);
  const cacheSnapshotRef = useRef(stableStringify({ bookmarks: cached?.bookmarks ?? [], categories: cached?.categories ?? [] }));

  const loadBookmarks = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const hasCache = Boolean(readCache());
    setLoading(!hasCache);
    setRefreshing(hasCache);
    setError(null);
    setLastError(null);

    try {
      const data = await api.getBookmarks(token);
      const nextSnapshot = stableStringify({ bookmarks: data.bookmarks, categories: data.categories });

      if (nextSnapshot !== cacheSnapshotRef.current) {
        setBookmarks(data.bookmarks);
        setCategories(data.categories);
        writeCache(data.bookmarks, data.categories);
        cacheSnapshotRef.current = nextSnapshot;
      }
    } catch (requestError) {
      setLastError(requestError);
      setError(requestError instanceof Error ? requestError.message : '加载书签失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    void loadBookmarks();
  }, [loadBookmarks]);

  const filteredBookmarks = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return bookmarks.filter((bookmark) => {
      const matchesCategory = category === '全部' || bookmark.category === category;
      const matchesSearch =
        keyword.length === 0 ||
        [bookmark.title, bookmark.subtitle, bookmark.url, bookmark.category]
          .join(' ')
          .toLowerCase()
          .includes(keyword);

      return matchesCategory && matchesSearch;
    });
  }, [bookmarks, category, search]);

  const createBookmark = useCallback(
    async (payload: BookmarkPayload) => {
      if (!token) {
        throw new Error('未登录');
      }

      setMutating(true);
      try {
        await api.createBookmark(token, payload);
        await loadBookmarks();
      } finally {
        setMutating(false);
      }
    },
    [loadBookmarks, token]
  );

  const updateBookmark = useCallback(
    async (id: string, payload: BookmarkPayload) => {
      if (!token) {
        throw new Error('未登录');
      }

      setMutating(true);
      try {
        await api.updateBookmark(token, id, payload);
        await loadBookmarks();
      } finally {
        setMutating(false);
      }
    },
    [loadBookmarks, token]
  );

  const deleteBookmark = useCallback(
    async (id: string) => {
      if (!token) {
        throw new Error('未登录');
      }

      setMutating(true);
      try {
        await api.deleteBookmark(token, id);
        await loadBookmarks();
      } finally {
        setMutating(false);
      }
    },
    [loadBookmarks, token]
  );

  const updateCategoryOrder = useCallback(
    async (nextCategories: string[]) => {
      if (!token) {
        throw new Error('未登录');
      }

      setMutating(true);
      try {
        await api.updateCategoryOrder(token, nextCategories);
        await loadBookmarks();
      } finally {
        setMutating(false);
      }
    },
    [loadBookmarks, token]
  );

  const createCategory = useCallback(
    async (name: string) => {
      if (!token) {
        throw new Error('未登录');
      }

      setMutating(true);
      try {
        await api.createCategory(token, name);
        await loadBookmarks();
      } finally {
        setMutating(false);
      }
    },
    [loadBookmarks, token]
  );

  return {
    bookmarks,
    filteredBookmarks,
    categories,
    loading,
    refreshing,
    mutating,
    error,
    lastError,
    reload: loadBookmarks,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    updateCategoryOrder,
    createCategory
  };
}
