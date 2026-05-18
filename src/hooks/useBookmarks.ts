import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../services/api';
import type { Bookmark, BookmarkPayload } from '../types';
import { readMigratedStorageItem, writeStorageItem } from '../utils/localStorage';
import { dataWorkerClient, type DataWorkerEvent } from '../workers/client';
import type { BookmarksSnapshot, SerializedApiError } from '../workers/protocol';

/**
 * Synchronous-readable mirror of the bookmarks snapshot.
 *
 * IndexedDB (where the worker keeps the authoritative copy) is async-only, so
 * we keep a localStorage shadow that the main thread can read on the very first
 * tick to render before the worker has had a chance to spin up. Writes are
 * driven by worker patches.
 */
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

function writeCache(snapshot: BookmarksSnapshot) {
  try {
    writeStorageItem(
      CACHE_KEY,
      JSON.stringify({
        bookmarks: snapshot.bookmarks,
        categories: snapshot.categories,
        ts: snapshot.ts
      } satisfies CachedData)
    );
  } catch {
    // quota exceeded, ignore
  }
}

function stableStringify(value: unknown) {
  return JSON.stringify(value);
}

function deserializeError(error: SerializedApiError): Error {
  if (error.code) {
    return new ApiError({ message: error.message, code: error.code, details: error.details });
  }
  return new Error(error.message);
}

interface UseBookmarksOptions {
  token: string | null;
  search: string;
  category: string;
  /** Called when the worker signals that the server-side token is no longer valid. */
  onAuthInvalid?: () => void;
}

export function useBookmarks({ token, search, category, onAuthInvalid }: UseBookmarksOptions) {
  const cached = useMemo(() => readCache(), []);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(cached?.bookmarks ?? []);
  const [categories, setCategories] = useState<string[]>(cached?.categories ?? []);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastError, setLastError] = useState<unknown>(null);
  const snapshotRef = useRef(stableStringify({
    bookmarks: cached?.bookmarks ?? [],
    categories: cached?.categories ?? []
  }));
  const onAuthInvalidRef = useRef(onAuthInvalid);
  onAuthInvalidRef.current = onAuthInvalid;

  // Apply a fresh snapshot from the worker, but skip the render entirely
  // when the data hasn't actually changed (avoids a re-render storm on every
  // background refresh).
  const applySnapshot = useCallback((snapshot: BookmarksSnapshot) => {
    const next = stableStringify({ bookmarks: snapshot.bookmarks, categories: snapshot.categories });
    if (next === snapshotRef.current) {
      return;
    }
    snapshotRef.current = next;
    setBookmarks(snapshot.bookmarks);
    setCategories(snapshot.categories);
    writeCache(snapshot);
  }, []);

  // Subscribe to worker events. Mounted once per token change.
  useEffect(() => {
    const unsubscribe = dataWorkerClient.subscribe((event: DataWorkerEvent) => {
      switch (event.type) {
        case 'snapshot':
          // IDB snapshot — may be fresher than the localStorage mirror.
          if (event.data) {
            applySnapshot(event.data);
          }
          setLoading(false);
          break;
        case 'patch':
          applySnapshot(event.data);
          setLoading(false);
          setRefreshing(false);
          setError(null);
          setLastError(null);
          break;
        case 'fetch-error':
          setRefreshing(false);
          setLastError(deserializeError(event.error));
          setError(event.error.message);
          break;
        case 'auth-invalid':
          setRefreshing(false);
          onAuthInvalidRef.current?.();
          break;
      }
    });

    return unsubscribe;
  }, [applySnapshot]);

  // Boot / token-change: tell the worker to fetch.
  useEffect(() => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    setError(null);
    setLastError(null);

    // Defer the worker spin-up to idle time so the first paint isn't taxed.
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    });

    let handle: number | undefined;
    let cancelled = false;
    const launch = () => {
      if (cancelled) return;
      dataWorkerClient.bootstrap(token);
    };

    if (typeof ric.requestIdleCallback === 'function') {
      handle = ric.requestIdleCallback(launch, { timeout: 1500 });
    } else {
      handle = window.setTimeout(launch, 0);
    }

    return () => {
      cancelled = true;
      if (handle !== undefined) {
        if (typeof ric.cancelIdleCallback === 'function') {
          ric.cancelIdleCallback(handle);
        } else {
          window.clearTimeout(handle);
        }
      }
    };
  }, [token]);

  const reload = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    dataWorkerClient.refresh();
  }, [token]);

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

  // ---- mutations ----
  // All mutations go through the worker. The worker performs the API call
  // then returns the fresh snapshot, which we apply unconditionally.

  const runMutation = useCallback(async (mutationFn: () => Promise<BookmarksSnapshot>): Promise<void> => {
    if (!token) {
      throw new Error('未登录');
    }
    setMutating(true);
    try {
      const snapshot = await mutationFn();
      applySnapshot(snapshot);
    } catch (e) {
      const err = e && typeof e === 'object' && 'message' in e
        ? deserializeError(e as SerializedApiError)
        : new Error('请求失败');
      setLastError(err);
      throw err;
    } finally {
      setMutating(false);
    }
  }, [token, applySnapshot]);

  const createBookmark = useCallback(
    (payload: BookmarkPayload) => runMutation(() => dataWorkerClient.mutate({ kind: 'create', payload })),
    [runMutation]
  );

  const updateBookmark = useCallback(
    (id: string, payload: BookmarkPayload) =>
      runMutation(() => dataWorkerClient.mutate({ kind: 'update', id, payload })),
    [runMutation]
  );

  const deleteBookmark = useCallback(
    (id: string) => runMutation(() => dataWorkerClient.mutate({ kind: 'delete', id })),
    [runMutation]
  );

  const updateCategoryOrder = useCallback(
    (nextCategories: string[]) =>
      runMutation(() => dataWorkerClient.mutate({ kind: 'category-order', categories: nextCategories })),
    [runMutation]
  );

  const createCategory = useCallback(
    (name: string) => runMutation(() => dataWorkerClient.mutate({ kind: 'category-create', name })),
    [runMutation]
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
    reload,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    updateCategoryOrder,
    createCategory
  };
}
