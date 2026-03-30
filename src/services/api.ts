import type { AuthResponse, Bookmark, BookmarkPayload, MetaResponse } from '../types';

const jsonHeaders = {
  'Content-Type': 'application/json'
};

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers ?? {});

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...init,
    headers
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'message' in data && typeof data.message === 'string'
        ? data.message
        : '请求失败';
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  login(password: string) {
    return request<AuthResponse>('/api/auth', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ password })
    });
  },
  verifyToken(token: string) {
    return request<{ valid: true }>('/api/auth', { method: 'GET' }, token);
  },
  getBookmarks(token: string) {
    return request<{ bookmarks: Bookmark[]; categories: string[] }>('/api/bookmarks', { method: 'GET' }, token);
  },
  updateCategoryOrder(token: string, categories: string[]) {
    return request<{ success: true }>('/api/bookmarks', {
      method: 'PATCH',
      body: JSON.stringify({ categories })
    }, token);
  },
  createCategory(token: string, name: string) {
    return request<{ success: true; name: string }>('/api/bookmarks?mode=category', {
      method: 'PATCH',
      body: JSON.stringify({ name })
    }, token);
  },
  createBookmark(token: string, payload: BookmarkPayload) {
    return request<{ bookmark: Bookmark }>('/api/bookmarks', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, token);
  },
  updateBookmark(token: string, id: string, payload: BookmarkPayload) {
    return request<{ bookmark: Bookmark }>(`/api/bookmarks?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }, token);
  },
  deleteBookmark(token: string, id: string) {
    return request<{ success: true }>(`/api/bookmarks?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }, token);
  },
  fetchMeta(url: string, token: string) {
    return request<MetaResponse>('/api/fetch-meta', {
      method: 'POST',
      body: JSON.stringify({ url })
    }, token);
  }
};
