/// <reference lib="webworker" />

import { get as idbGet, set as idbSet } from 'idb-keyval';
import type {
  BookmarksSnapshot,
  MainToWorkerMessage,
  SerializedApiError,
  WorkerToMainMessage,
  MutationKind
} from './protocol';
import type { Bookmark } from '../types';

/**
 * AIPanel data worker.
 *
 * Owns:
 *  - the IndexedDB-backed bookmark snapshot
 *  - all network calls to /api/bookmarks
 *  - the current auth token (received from the main thread)
 *
 * Does NOT own:
 *  - UI state
 *  - optimistic update bookkeeping (the main thread keeps that)
 */

declare const self: DedicatedWorkerGlobalScope;

const IDB_SNAPSHOT_KEY = 'aipanel:bookmarks:snapshot:v1';

let authToken: string | null = null;

// -----------------------------
// Helpers
// -----------------------------

function post(message: WorkerToMainMessage) {
  self.postMessage(message);
}

function serializeError(error: unknown): SerializedApiError {
  if (error && typeof error === 'object') {
    const anyError = error as { message?: unknown; code?: unknown; details?: unknown };
    return {
      message: typeof anyError.message === 'string' ? anyError.message : '请求失败',
      code: typeof anyError.code === 'string' ? anyError.code : undefined,
      details: anyError.details && typeof anyError.details === 'object'
        ? (anyError.details as Record<string, unknown>)
        : undefined
    };
  }
  return { message: '请求失败' };
}

class WorkerApiError extends Error {
  code?: string;
  details?: Record<string, unknown>;
  status: number;

  constructor(message: string, status: number, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  if (!authToken) {
    throw new WorkerApiError('未登录', 401);
  }

  const headers = new Headers(init.headers ?? {});
  headers.set('Authorization', `Bearer ${authToken}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, { ...init, headers });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const payload = (data && typeof data === 'object') ? data as Record<string, unknown> : {};
    const message = typeof payload.message === 'string' ? payload.message : '请求失败';
    const code = typeof payload.code === 'string' ? payload.code : undefined;
    const details = payload.details && typeof payload.details === 'object'
      ? (payload.details as Record<string, unknown>)
      : undefined;
    throw new WorkerApiError(message, response.status, code, details);
  }

  return data as T;
}

async function readSnapshotFromIdb(): Promise<BookmarksSnapshot | null> {
  try {
    const stored = await idbGet<BookmarksSnapshot>(IDB_SNAPSHOT_KEY);
    return stored ?? null;
  } catch {
    return null;
  }
}

async function writeSnapshotToIdb(snapshot: BookmarksSnapshot) {
  try {
    await idbSet(IDB_SNAPSHOT_KEY, snapshot);
  } catch {
    // quota exceeded or browser blocks IDB; ignore
  }
}

function buildSnapshot(bookmarks: Bookmark[], categories: string[]): BookmarksSnapshot {
  return { bookmarks, categories, ts: Date.now() };
}

// -----------------------------
// Server interactions
// -----------------------------

async function fetchBookmarks(): Promise<BookmarksSnapshot> {
  const data = await apiFetch<{ bookmarks: Bookmark[]; categories: string[] }>(
    '/api/bookmarks',
    { method: 'GET' }
  );
  const snapshot = buildSnapshot(data.bookmarks, data.categories);
  void writeSnapshotToIdb(snapshot);
  return snapshot;
}

async function applyMutation(mutation: MutationKind): Promise<BookmarksSnapshot> {
  switch (mutation.kind) {
    case 'create':
      await apiFetch<{ bookmark: Bookmark }>('/api/bookmarks', {
        method: 'POST',
        body: JSON.stringify(mutation.payload)
      });
      break;
    case 'update':
      await apiFetch<{ bookmark: Bookmark }>(
        `/api/bookmarks?id=${encodeURIComponent(mutation.id)}`,
        { method: 'PUT', body: JSON.stringify(mutation.payload) }
      );
      break;
    case 'delete':
      await apiFetch<{ success: true }>(
        `/api/bookmarks?id=${encodeURIComponent(mutation.id)}`,
        { method: 'DELETE' }
      );
      break;
    case 'category-order':
      await apiFetch<{ success: true }>('/api/bookmarks', {
        method: 'PATCH',
        body: JSON.stringify({ categories: mutation.categories })
      });
      break;
    case 'category-create':
      await apiFetch<{ success: true }>('/api/bookmarks?mode=category', {
        method: 'PATCH',
        body: JSON.stringify({ name: mutation.name })
      });
      break;
  }

  // After any mutation we re-fetch the canonical snapshot so the UI converges
  // on whatever the Bitable side now says.
  return fetchBookmarks();
}

// -----------------------------
// Message handlers
// -----------------------------

async function handleBootstrap(reqId: number, token: string) {
  authToken = token;

  // 1. Push the IDB snapshot first (may be slightly fresher than the localStorage
  //    mirror the main thread used for the synchronous boot paint).
  const cached = await readSnapshotFromIdb();
  post({ type: 'snapshot', reqId, data: cached });

  // 2. Then go fetch the latest.
  try {
    const fresh = await fetchBookmarks();
    post({ type: 'patch', reqId, data: fresh });
  } catch (error) {
    if (error instanceof WorkerApiError && error.status === 401) {
      authToken = null;
      post({ type: 'auth-invalid', reqId });
    } else {
      post({ type: 'fetch-error', reqId, error: serializeError(error) });
    }
  }
}

async function handleRefresh(reqId: number) {
  if (!authToken) {
    post({ type: 'auth-invalid', reqId });
    return;
  }

  try {
    const fresh = await fetchBookmarks();
    post({ type: 'patch', reqId, data: fresh });
  } catch (error) {
    if (error instanceof WorkerApiError && error.status === 401) {
      authToken = null;
      post({ type: 'auth-invalid', reqId });
      return;
    }
    post({ type: 'fetch-error', reqId, error: serializeError(error) });
  }
}

async function handleMutate(reqId: number, mutation: MutationKind) {
  if (!authToken) {
    post({
      type: 'mutate-fail',
      reqId,
      error: { message: '未登录' }
    });
    return;
  }

  try {
    const fresh = await applyMutation(mutation);
    post({ type: 'mutate-ok', reqId, data: fresh });
  } catch (error) {
    if (error instanceof WorkerApiError && error.status === 401) {
      authToken = null;
      post({ type: 'auth-invalid', reqId });
      return;
    }
    post({ type: 'mutate-fail', reqId, error: serializeError(error) });
  }
}

self.addEventListener('message', (event: MessageEvent<MainToWorkerMessage>) => {
  const message = event.data;
  switch (message.type) {
    case 'bootstrap':
      void handleBootstrap(message.reqId, message.token);
      break;
    case 'refresh':
      void handleRefresh(message.reqId);
      break;
    case 'mutate':
      void handleMutate(message.reqId, message.mutation);
      break;
    case 'set-token':
      authToken = message.token;
      break;
  }
});
