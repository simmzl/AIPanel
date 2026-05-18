export interface ConfirmDialogState {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
}

interface ConfirmDialogProps {
  dialog: ConfirmDialogState | null;
  onClose: () => void;
}

export function ConfirmDialog({ dialog, onClose }: ConfirmDialogProps) {
  if (!dialog) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-3 backdrop-blur-sm sm:p-4">
      <div className="w-full max-w-md rounded-[16px] bg-[var(--panel-elevated)] p-4 shadow-[var(--shadow-strong)] sm:p-5 md:p-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--accent-strong)] sm:text-sm sm:tracking-[0.3em]">
          Confirm action
        </p>
        <h2
          className="mt-2 text-[28px] leading-none text-[var(--text-main)] sm:text-3xl"
          style={{ fontFamily: 'Instrument Serif, serif' }}
        >
          {dialog.title}
        </h2>
        <p className="mt-4 text-sm leading-6 text-[var(--text-muted)] whitespace-pre-wrap break-words">
          {dialog.message}
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] bg-[var(--button-ghost)] px-4 py-2.5 text-sm text-[var(--text-strong)] transition duration-200 hover:bg-[var(--button-ghost-hover)]"
          >
            {dialog.cancelLabel ?? '取消'}
          </button>
          <button
            type="button"
            onClick={() => {
              const result = dialog.onConfirm();
              onClose();
              void result;
            }}
            className={`rounded-[10px] px-4 py-2.5 text-sm font-medium transition duration-200 ${
              dialog.danger
                ? 'bg-rose-500/15 text-rose-500 hover:bg-rose-500/20'
                : 'bg-[var(--button-primary)] text-[var(--text-main)] hover:bg-[var(--button-primary-hover)]'
            }`}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
