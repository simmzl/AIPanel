import type { Bookmark, BookmarkPayload } from '../types';

/**
 * Wire protocol between the React UI thread and the data worker.
 *
 * Design notes:
 *  - All messages carry a `reqId` so the main thread can match responses to requests
 *    where it matters (mutate flow). Pure pushes from the worker (snapshot, patch)
 *    use reqId=0.
 *  - The worker is authoritative for IDB writes. The main thread keeps a separate
 *    localStorage mirror for the synchronous boot path (IDB is async-only).
 *  - Optimistic UI updates live on the main thread. The worker only reports the
 *    real outcome via mutate-ok / mutate-fail; the main thread is responsible
 *    for committing or rolling back.
 */

export interface BookmarksSnapshot {
  bookmarks: Bookmark[];
  categories: string[];
  ts: number;
}

// ---- main → worker ----

export type MutationKind =
  | { kind: 'create'; payload: BookmarkPayload }
  | { kind: 'update'; id: string; payload: BookmarkPayload }
  | { kind: 'delete'; id: string }
  | { kind: 'category-order'; categories: string[] }
  | { kind: 'category-create'; name: string };

export type MainToWorkerMessage =
  | {
      type: 'bootstrap';
      reqId: number;
      token: string;
    }
  | {
      type: 'refresh';
      reqId: number;
    }
  | {
      type: 'mutate';
      reqId: number;
      mutation: MutationKind;
    }
  | {
      type: 'set-token';
      reqId: number;
      token: string | null;
    };

// ---- worker → main ----

export type WorkerToMainMessage =
  | {
      // Sent immediately after bootstrap with whatever the worker can read from IDB.
      // Lets the UI swap to the (possibly fresher) IDB snapshot before the network roundtrip.
      type: 'snapshot';
      reqId: number;
      data: BookmarksSnapshot | null;
    }
  | {
      // Fresh server-side data. Replaces whatever the UI is currently showing.
      // We send the full snapshot rather than a diff because the dataset is small
      // (hundreds of items at most) and diffing on the worker side is cheap-enough
      // that the wire size win is not worth the consistency risk.
      type: 'patch';
      reqId: number;
      data: BookmarksSnapshot;
    }
  | {
      type: 'mutate-ok';
      reqId: number;
      data: BookmarksSnapshot;
    }
  | {
      type: 'mutate-fail';
      reqId: number;
      error: SerializedApiError;
    }
  | {
      // The server told us the token is no longer valid.
      // The main thread should drop the token and surface the login page.
      type: 'auth-invalid';
      reqId: number;
    }
  | {
      // Non-fatal background fetch failure (network, 5xx, etc.).
      // The UI continues to show whatever it had.
      type: 'fetch-error';
      reqId: number;
      error: SerializedApiError;
    };

export interface SerializedApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}
