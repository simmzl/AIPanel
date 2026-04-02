import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode
} from 'react';
import type { Bookmark } from '../types';

function getHostname(url: string) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function isPrivateHostname(hostname: string) {
  if (!hostname) return true;
  if (hostname === 'localhost') return true;
  if (hostname.endsWith('.local') || hostname.endsWith('.lan') || hostname.endsWith('.home') || hostname.endsWith('.internal')) {
    return true;
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    if (/^10\./.test(hostname)) return true;
    if (/^127\./.test(hostname)) return true;
    if (/^192\.168\./.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) return true;
    if (/^169\.254\./.test(hostname)) return true;
  }
  return false;
}

function getFallbackLabel(title: string) {
  const trimmed = title.trim();
  const han = trimmed.match(/[\p{Script=Han}]/u)?.[0];
  if (han) return han;

  const latin = trimmed.match(/[A-Za-z0-9]/)?.[0];
  if (latin) return latin.toUpperCase();

  return '#';
}

function getFallbackTone(seed: string) {
  const tones = [
    'bg-[#d7efe9] text-[#295a52]',
    'bg-[#dcebf1] text-[#345d69]',
    'bg-[#f0e7c3] text-[#6d5c21]',
    'bg-[#eddcf0] text-[#69486e]',
    'bg-[#e3efd8] text-[#506b3c]'
  ];

  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return tones[hash % tones.length];
}

function isGoogleFallbackIcon(url: string) {
  return /(^https?:\/\/)?(www\.)?(google\.com\/s2\/favicons|t0\.gstatic\.com\/faviconV2)/i.test(url);
}

function shouldUseProvidedIcon(bookmark: Bookmark) {
  if (!bookmark.favicon || !bookmark.favicon.trim()) return false;
  if (!bookmark.favicon.startsWith('http')) return false;
  if (isGoogleFallbackIcon(bookmark.favicon)) return false;

  const faviconHostname = getHostname(bookmark.favicon);
  if (!faviconHostname || isPrivateHostname(faviconHostname)) return false;

  return true;
}

function resolveFavicon(bookmark: Bookmark): string | null {
  if (shouldUseProvidedIcon(bookmark)) return bookmark.favicon;

  const hostname = getHostname(bookmark.url);
  if (!hostname || isPrivateHostname(hostname)) return null;

  try {
    const target = new URL(bookmark.url);
    return `${target.origin}/favicon.ico`;
  } catch {
    return null;
  }
}

function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore unsupported vibration errors
  }
}

function DesktopIconButton({
  title,
  onClick,
  children,
  tone = 'default'
}: {
  title: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full transition duration-200 ${
        tone === 'danger'
          ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/16'
          : 'bg-[var(--surface-subtle)] text-[var(--text-main)] hover:bg-[var(--surface-subtle-hover)]'
      }`}
    >
      {children}
    </button>
  );
}

function OverlayTextButton({
  title,
  onClick,
  tone = 'default'
}: {
  title: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      aria-label={title}
      onClick={onClick}
      className={`flex-1 whitespace-nowrap rounded-[14px] px-1 py-1 text-center text-[12px] font-medium leading-none tracking-[0] transition duration-200 active:scale-[0.98] ${
        tone === 'danger'
          ? 'bg-[var(--surface-button-danger)] text-rose-500 shadow-[inset_0_0_0_0.5px_rgba(251,113,133,0.10)]'
          : 'bg-[var(--surface-button)] text-[var(--text-main)] shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.05)]'
      }`}
    >
      {title}
    </button>
  );
}

interface BookmarkCardProps {
  bookmark: Bookmark;
  pinned?: boolean;
  onOpen: (bookmark: Bookmark) => void;
  onTogglePin: (bookmark: Bookmark) => void;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
}

export function BookmarkCard({
  bookmark,
  pinned = false,
  onOpen,
  onTogglePin,
  onEdit,
  onDelete
}: BookmarkCardProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(() => resolveFavicon(bookmark));
  const [retried, setRetried] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const cardRef = useRef<HTMLElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const fallbackLabel = useMemo(() => getFallbackLabel(bookmark.title), [bookmark.title]);
  const fallbackTone = useMemo(() => getFallbackTone(bookmark.title || bookmark.url), [bookmark.title, bookmark.url]);
  const hostname = useMemo(() => bookmark.url.replace(/^https?:\/\//, ''), [bookmark.url]);

  useEffect(() => {
    setImgSrc(resolveFavicon(bookmark));
    setRetried(false);
    setImgFailed(false);
    setShowActions(false);
    longPressTriggeredRef.current = false;
  }, [bookmark]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showActions) return;

    const handleGlobalPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (cardRef.current?.contains(target)) return;
      setShowActions(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowActions(false);
      }
    };

    document.addEventListener('pointerdown', handleGlobalPointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handleGlobalPointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showActions]);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'touch') return;

    event.preventDefault();
    longPressTriggeredRef.current = false;
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setShowActions(true);
      vibrate(18);
    }, 420);
  };

  const handlePointerUpOrCancel = () => {
    clearLongPressTimer();
  };

  const handleCardClick = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }

    if (showActions) {
      setShowActions(false);
      return;
    }

    onOpen(bookmark);
  };

  const handleImgError = () => {
    if (!retried && imgSrc && imgSrc !== bookmark.favicon && bookmark.favicon && shouldUseProvidedIcon(bookmark)) {
      setImgSrc(bookmark.favicon);
      setRetried(true);
      return;
    }

    setImgSrc(null);
    setImgFailed(true);
    setRetried(true);
  };

  const touchCardStyle: CSSProperties = {
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
    touchAction: 'manipulation'
  };

  return (
    <article
      ref={cardRef}
      className="group relative cursor-pointer overflow-hidden rounded-[12px] bg-[var(--panel-card)] p-2.5 shadow-[var(--card-shadow)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--panel-card-hover)] active:bg-[var(--panel-card-active)] md:rounded-[14px] md:p-3"
      onClick={handleCardClick}
      onContextMenu={(event) => {
        if (showActions) {
          event.preventDefault();
          return;
        }

        const nativeEvent = event.nativeEvent as PointerEvent & { pointerType?: string };
        if (nativeEvent.pointerType === 'touch') {
          event.preventDefault();
        }
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUpOrCancel}
      onPointerLeave={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      style={touchCardStyle}
    >
      <div className={`absolute right-3 top-3 z-20 hidden items-center gap-1 transition duration-150 md:flex ${showActions ? 'pointer-events-none opacity-0' : 'pointer-events-none opacity-0 md:pointer-events-auto md:group-hover:opacity-100'}`}>
        <DesktopIconButton
          title={pinned ? '取消置顶' : '置顶'}
          onClick={(event) => {
            event.stopPropagation();
            onTogglePin(bookmark);
          }}
        >
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
            <path d="M7.5 3.5h5l-.8 3.2 2.3 2.1H6.8l2.3-2.1L7.5 3.5Zm2.5 5.3v7.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </DesktopIconButton>
        <DesktopIconButton
          title="编辑"
          onClick={(event) => {
            event.stopPropagation();
            onEdit(bookmark);
          }}
        >
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
            <path d="M3.8 13.9 13.9 3.8a1.6 1.6 0 0 1 2.3 0l.1.1a1.6 1.6 0 0 1 0 2.3L6.1 16.2 3 17l.8-3.1Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </DesktopIconButton>
        <DesktopIconButton
          title="删除"
          tone="danger"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(bookmark);
          }}
        >
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
            <path d="M4.5 5.8h11M8 3.8h4m-5.5 2 0.6 9a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l0.6-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </DesktopIconButton>
      </div>

      <div className={`transition duration-200 ${showActions ? 'scale-[0.985] opacity-30 blur-[1px]' : 'opacity-100'}`}>
        <div className="flex items-start gap-3 pr-0 md:gap-3.5 md:pr-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(255,255,255,0.92)] md:h-10 md:w-10 md:rounded-[11px]">
            {imgSrc && !imgFailed ? (
              <img
                src={imgSrc}
                alt=""
                className="h-6 w-6 rounded-md object-cover md:h-6.5 md:w-6.5"
                onError={handleImgError}
              />
            ) : (
              <div className={`flex h-6 w-6 items-center justify-center rounded-md text-[12px] font-semibold md:h-6.5 md:w-6.5 md:text-sm ${fallbackTone}`}>
                {fallbackLabel}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-[14px] font-semibold leading-5 text-[var(--text-main)] md:text-[15px] md:line-clamp-1 md:leading-[1.3]">
              {bookmark.title}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-[12px] leading-4 text-[var(--text-muted)] md:text-[13px] md:leading-[1.3]">
              {bookmark.subtitle || bookmark.category}
            </p>
          </div>
        </div>

        <div className="mt-2.5 border-t border-[var(--border-subtle)] pt-2.5 md:mt-3 md:pt-3" style={{ borderTopWidth: '0.5px' }}>
          <div className="flex w-full items-center justify-end gap-2">
            <span className="min-w-0 truncate text-right text-[11px] text-[var(--text-soft)]">{hostname}</span>
          </div>
        </div>
      </div>

      <div
        className={`absolute inset-0 z-30 transition duration-200 md:hidden ${showActions ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        <div className="flex h-full w-full items-center rounded-[12px] bg-[var(--surface-overlay)] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.16)] md:rounded-[14px]">
          <div className="grid w-full grid-cols-3 gap-2.5">
            <OverlayTextButton
              title={pinned ? '置顶' : '置顶'}
              onClick={(event) => {
                event.stopPropagation();
                setShowActions(false);
                vibrate(10);
                onTogglePin(bookmark);
              }}
            />
            <OverlayTextButton
              title="编辑"
              onClick={(event) => {
                event.stopPropagation();
                setShowActions(false);
                vibrate(10);
                onEdit(bookmark);
              }}
            />
            <OverlayTextButton
              title="删除"
              tone="danger"
              onClick={(event) => {
                event.stopPropagation();
                setShowActions(false);
                vibrate([10, 30, 10]);
                onDelete(bookmark);
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
