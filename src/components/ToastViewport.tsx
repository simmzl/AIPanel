import { CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'info' | 'loading';

export interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void | Promise<void>;
  };
  duration?: number;
}

interface ToastViewportProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

function ToastIcon({ tone }: { tone: ToastTone }) {
  if (tone === 'success') return <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" aria-hidden="true" />;
  if (tone === 'error') return <XCircle className="h-4.5 w-4.5 text-rose-500" aria-hidden="true" />;
  if (tone === 'loading') return <Loader2 className="h-4.5 w-4.5 animate-spin text-[var(--accent-strong)]" aria-hidden="true" />;
  return <Info className="h-4.5 w-4.5 text-[var(--accent-strong)]" aria-hidden="true" />;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[90] flex flex-col items-center gap-2 px-3 sm:top-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-auto flex w-full max-w-[min(92vw,420px)] items-start gap-3 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--panel-elevated)] px-3.5 py-3 text-[var(--text-main)] shadow-[var(--shadow-strong)] backdrop-blur-xl"
          style={{ borderWidth: '0.5px' }}
        >
          <div className="mt-0.5 shrink-0">
            <ToastIcon tone={toast.tone} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-5 text-[var(--text-main)]">{toast.title}</p>
            {toast.message ? <p className="mt-0.5 text-xs leading-5 text-[var(--text-muted)]">{toast.message}</p> : null}
            {toast.action ? (
              <button
                type="button"
                onClick={() => {
                  void toast.action?.onClick();
                  onDismiss(toast.id);
                }}
                className="mt-2 rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-main)] transition duration-200 hover:opacity-90"
              >
                {toast.action.label}
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--text-soft)] transition duration-200 hover:bg-[var(--surface-subtle)] hover:text-[var(--text-main)]"
            aria-label="关闭提示"
            title="关闭提示"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
