import type {
  BookmarksSnapshot,
  MainToWorkerMessage,
  MutationKind,
  SerializedApiError,
  WorkerToMainMessage
} from './protocol';

/**
 * Main-thread client for the data worker.
 *
 * Responsibilities:
 *  - Lazily spawn a single dedicated worker
 *  - Send typed commands
 *  - Fan out incoming messages to subscribed listeners
 *  - For mutate calls, return a Promise that resolves/rejects when the worker
 *    reports back with the matching reqId
 */

export type DataWorkerEvent =
  | { type: 'snapshot'; data: BookmarksSnapshot | null }
  | { type: 'patch'; data: BookmarksSnapshot }
  | { type: 'fetch-error'; error: SerializedApiError }
  | { type: 'auth-invalid' };

type Listener = (event: DataWorkerEvent) => void;

interface PendingMutation {
  resolve: (snapshot: BookmarksSnapshot) => void;
  reject: (error: SerializedApiError) => void;
}

let workerInstance: Worker | null = null;
const listeners = new Set<Listener>();
const pendingMutations = new Map<number, PendingMutation>();
let nextReqId = 1;

function emit(event: DataWorkerEvent) {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // listener errors are isolated
    }
  }
}

function handleMessage(event: MessageEvent<WorkerToMainMessage>) {
  const message = event.data;

  switch (message.type) {
    case 'snapshot':
      emit({ type: 'snapshot', data: message.data });
      return;
    case 'patch':
      emit({ type: 'patch', data: message.data });
      return;
    case 'auth-invalid': {
      emit({ type: 'auth-invalid' });
      // any pending mutation tied to this reqId also fails
      const pending = pendingMutations.get(message.reqId);
      if (pending) {
        pendingMutations.delete(message.reqId);
        pending.reject({ message: 'token 已失效', code: 'AUTH_INVALID' });
      }
      return;
    }
    case 'mutate-ok': {
      const pending = pendingMutations.get(message.reqId);
      if (pending) {
        pendingMutations.delete(message.reqId);
        pending.resolve(message.data);
      }
      // Also broadcast the fresh snapshot as a patch so listeners stay in sync
      emit({ type: 'patch', data: message.data });
      return;
    }
    case 'mutate-fail': {
      const pending = pendingMutations.get(message.reqId);
      if (pending) {
        pendingMutations.delete(message.reqId);
        pending.reject(message.error);
      }
      return;
    }
    case 'fetch-error':
      emit({ type: 'fetch-error', error: message.error });
      return;
  }
}

function ensureWorker(): Worker {
  if (workerInstance) return workerInstance;

  // Vite turns this into a separate worker bundle with proper module support
  workerInstance = new Worker(
    new URL('./data-worker.ts', import.meta.url),
    { type: 'module', name: 'aipanel-data' }
  );

  workerInstance.addEventListener('message', handleMessage);
  workerInstance.addEventListener('error', (ev) => {
    // surface as a generic fetch error so the UI doesn't get stuck
    emit({
      type: 'fetch-error',
      error: { message: ev.message || 'worker 失败' }
    });
  });

  return workerInstance;
}

function post(message: MainToWorkerMessage) {
  ensureWorker().postMessage(message);
}

// ---- public API ----

export const dataWorkerClient = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  bootstrap(token: string): void {
    post({ type: 'bootstrap', reqId: nextReqId++, token });
  },

  setToken(token: string | null): void {
    // Don't spawn the worker just to clear the token; only forward if it exists.
    if (!workerInstance) return;
    post({ type: 'set-token', reqId: nextReqId++, token });
  },

  refresh(): void {
    post({ type: 'refresh', reqId: nextReqId++ });
  },

  mutate(mutation: MutationKind): Promise<BookmarksSnapshot> {
    return new Promise((resolve, reject) => {
      const reqId = nextReqId++;
      pendingMutations.set(reqId, { resolve, reject });
      post({ type: 'mutate', reqId, mutation });
    });
  },

  /**
   * Terminate the worker. Intended for logout, where we want to drop
   * any in-flight requests and clear in-memory token in the worker.
   */
  terminate(): void {
    if (!workerInstance) return;
    workerInstance.terminate();
    workerInstance = null;
    // Any unresolved mutations should reject so callers don't hang
    for (const [, pending] of pendingMutations) {
      pending.reject({ message: 'worker 已终止', code: 'WORKER_TERMINATED' });
    }
    pendingMutations.clear();
  }
};
