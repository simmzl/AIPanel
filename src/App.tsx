import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { BookmarkPlus, Database, GitBranch, LogOut, Monitor, Moon, Sun, Wrench } from 'lucide-react';
import { BookmarkGrid } from './components/BookmarkGrid';
import { CategoryTabs } from './components/CategoryTabs';
import { SearchBar } from './components/SearchBar';
import { ConfirmDialog, type ConfirmDialogState } from './components/ConfirmDialog';
import { useBookmarks } from './hooks/useBookmarks';
import { ApiError, api } from './services/api';
import type { Bookmark, BookmarkPayload } from './types';
import { readMigratedStorageItem, removeStorageItem, writeStorageItem } from './utils/localStorage';
import { dataWorkerClient } from './workers/client';

const LoginPage = lazy(() => import('./components/LoginPage').then((m) => ({ default: m.LoginPage })));
const AddBookmark = lazy(() => import('./components/AddBookmark').then((m) => ({ default: m.AddBookmark })));

function isJwtLikelyValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    ) as { exp?: number };
    if (typeof payload.exp !== 'number') return false;
    // require at least 60s of remaining validity to be optimistic
    return payload.exp * 1000 > Date.now() + 60_000;
  } catch {
    return false;
  }
}

const TOKEN_KEY = 'token';
const LEGACY_PINNED_KEY = 'pinned_ids';
const PINNED_MIGRATION_KEY = 'pinned_ids_migrated_to_db';
const RECENT_KEY = 'recent_ids';
const THEME_KEY = 'theme_preference';
const RECENT_LIMIT = 12;
const DATA_SOURCE_URL = __AIPANEL_FEISHU_BITABLE_SOURCE_URL__;

type ThemePreference = 'system' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

const themeOptions = [
  { value: 'system', label: '跟随系统', icon: Monitor },
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon }
] as const;

type FeishuScopeAuthPrompt = {
  message: string;
  authorizationUrl?: string;
  requestId?: string;
  permissionViolations?: string[];
  rawMessage?: string;
};

function readStringArray(key: string) {
  try {
    const raw = readMigratedStorageItem(key);
    if (!raw) return [] as string[];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [] as string[];
  }
}

function writeStringArray(key: string, value: string[]) {
  try {
    writeStorageItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function sortByCategoryAndOrder(items: Bookmark[]) {
  return [...items].sort(
    (left, right) =>
      left.category.localeCompare(right.category, 'zh-CN') ||
      left.order - right.order ||
      left.title.localeCompare(right.title, 'zh-CN')
  );
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const stored = readMigratedStorageItem(THEME_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}


function buildFeishuScopeAuthPrompt(error: unknown): FeishuScopeAuthPrompt | null {
  if (!(error instanceof ApiError) || error.code !== 'FEISHU_SCOPE_AUTH_REQUIRED') {
    return null;
  }

  const permissionViolations = Array.isArray(error.details?.permissionViolations)
    ? error.details?.permissionViolations
        ?.map((item) => (item && typeof item.subject === 'string' ? item.subject : ''))
        .filter(Boolean)
    : [];

  return {
    message: error.message,
    authorizationUrl: typeof error.details?.authorizationUrl === 'string' ? error.details.authorizationUrl : undefined,
    requestId: typeof error.details?.requestId === 'string' ? error.details.requestId : undefined,
    permissionViolations,
    rawMessage: typeof error.details?.rawMessage === 'string' ? error.details.rawMessage : undefined
  };
}

function SectionHeader({
  title,
  subtitle,
  action
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 md:mb-5">
      <div>
        <h2 className="text-xl text-[var(--text-main)] md:text-[28px]" style={{ fontFamily: 'Instrument Serif, serif' }}>
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-xs text-[var(--text-soft)] md:text-sm">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export default function App() {
  // Synchronously read token at boot. If it's structurally valid and unexpired,
  // optimistically trust it so the first paint shows cached bookmarks immediately.
  // Real verification happens in the background; on failure we drop the token.
  const initialToken = (() => {
    const stored = readMigratedStorageItem(TOKEN_KEY);
    return stored && isJwtLikelyValid(stored) ? stored : null;
  })();

  const [token, setToken] = useState<string | null>(initialToken);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => getStoredThemePreference());
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>(() => readStringArray(RECENT_KEY));
  const [feishuScopeAuthPrompt, setFeishuScopeAuthPrompt] = useState<FeishuScopeAuthPrompt | null>(null);
  const [repairing, setRepairing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [lastSyncErrorMessage, setLastSyncErrorMessage] = useState<string | null>(null);
  const pinnedMigrationStartedRef = useRef(false);

  // Background token verification. Doesn't block first paint.
  useEffect(() => {
    if (!initialToken) return;

    let cancelled = false;
    void (async () => {
      try {
        await api.verifyToken(initialToken);
      } catch {
        if (cancelled) return;
        removeStorageItem(TOKEN_KEY);
        setToken(null);
      }
    })();

    return () => {
      cancelled = true;
    };
    // initialToken is captured once at boot, don't re-run on token state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { bookmarks, filteredBookmarks, categories, loading, refreshing, mutating, error, lastError, createBookmark, updateBookmark, deleteBookmark, updateBookmarkPin, updateCategoryOrder, createCategory } = useBookmarks({
    token,
    search,
    category,
    onAuthInvalid: () => {
      removeStorageItem(TOKEN_KEY);
      setToken(null);
    }
  });

  const successToast = (message: string) => toast.success(message);
  const infoToast = (message: string) => toast(message);
  const showErrorToast = (title: string, error?: unknown) => {
    toast.error(error instanceof Error ? `${title}：${error.message}` : title);
  };

  const showFeishuScopePrompt = (error: unknown) => {
    const prompt = buildFeishuScopeAuthPrompt(error);
    if (prompt) {
      setFeishuScopeAuthPrompt(prompt);
      toast.error(`需要补充飞书权限：${prompt.message}`);
      return true;
    }
    return false;
  };

  const resolvedTheme: ResolvedTheme = themePreference === 'system' ? systemTheme : themePreference;
  const allTabs = useMemo(() => ['全部', ...categories], [categories]);
  const hotToastOptions = useMemo(
    () => ({
      duration: 3200,
      style: {
        maxWidth: 'min(92vw, 420px)',
        padding: '12px 14px',
        borderRadius: '14px',
        border: '0.5px solid var(--border-subtle)',
        background: 'var(--panel-elevated)',
        color: 'var(--text-main)',
        boxShadow: resolvedTheme === 'dark' ? 'var(--shadow-strong)' : '0 18px 50px rgba(20, 38, 32, 0.10)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        fontSize: '14px',
        lineHeight: '20px'
      },
      success: {
        iconTheme: {
          primary: 'var(--accent-strong)',
          secondary: resolvedTheme === 'dark' ? '#101211' : '#f6faf8'
        }
      },
      error: {
        duration: 5200,
        iconTheme: {
          primary: '#f43f5e',
          secondary: resolvedTheme === 'dark' ? '#101211' : '#fff1f2'
        }
      },
      loading: {
        iconTheme: {
          primary: 'var(--accent-strong)',
          secondary: resolvedTheme === 'dark' ? '#101211' : '#f6faf8'
        }
      }
    }),
    [resolvedTheme]
  );

  useEffect(() => {
    if (category !== '全部' && !categories.includes(category)) {
      setCategory('全部');
    }
  }, [categories, category]);

  useEffect(() => {
    if (!token || loading || pinnedMigrationStartedRef.current) return;
    if (readMigratedStorageItem(PINNED_MIGRATION_KEY) === '1') return;

    const legacyPinnedIds = readStringArray(LEGACY_PINNED_KEY);
    if (legacyPinnedIds.length === 0) {
      writeStorageItem(PINNED_MIGRATION_KEY, '1');
      return;
    }
    if (bookmarks.length === 0) return;

    const bookmarkMap = new Map(bookmarks.map((bookmark) => [bookmark.id, bookmark]));
    const idsToMigrate = legacyPinnedIds.filter((id) => {
      const bookmark = bookmarkMap.get(id);
      return bookmark && !bookmark.pinned;
    });

    if (idsToMigrate.length === 0) {
      removeStorageItem(LEGACY_PINNED_KEY);
      writeStorageItem(PINNED_MIGRATION_KEY, '1');
      return;
    }

    pinnedMigrationStartedRef.current = true;
    void (async () => {
      try {
        for (const id of idsToMigrate) {
          await updateBookmarkPin(id, true);
        }
        removeStorageItem(LEGACY_PINNED_KEY);
        writeStorageItem(PINNED_MIGRATION_KEY, '1');
        successToast(`已迁移 ${idsToMigrate.length} 个置顶书签到数据库`);
      } catch (migrationError) {
        pinnedMigrationStartedRef.current = false;
        showErrorToast('置顶数据迁移失败', migrationError);
      }
    })();
  }, [bookmarks, loading, token, updateBookmarkPin]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 480);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => setSystemTheme(media.matches ? 'dark' : 'light');
    apply();

    media.addEventListener?.('change', apply);
    return () => media.removeEventListener?.('change', apply);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  const pinnedBookmarks = useMemo(() => bookmarks.filter((item) => item.pinned), [bookmarks]);

  const recentBookmarks = useMemo(() => {
    const map = new Map(bookmarks.map((item) => [item.id, item]));
    return recentIds
      .map((id) => map.get(id))
      .filter((item): item is Bookmark => Boolean(item && !item.pinned));
  }, [bookmarks, recentIds]);

  const groupedBookmarks = useMemo(() => {
    const source = search.trim() || category !== '全部' ? filteredBookmarks : bookmarks;
    const groups = new Map<string, Bookmark[]>();

    for (const bookmark of source) {
      if (bookmark.pinned) continue;

      const key = bookmark.category || '其他';
      const list = groups.get(key) ?? [];
      list.push(bookmark);
      groups.set(key, list);
    }

    return Array.from(groups.entries()).map(([name, items]) => ({
      name,
      items: sortByCategoryAndOrder(items)
    }));
  }, [bookmarks, filteredBookmarks, search, category]);

  const isFlowMode = search.trim() === '' && category === '全部';

  useEffect(() => {
    if (!lastError) return;

    const prompt = buildFeishuScopeAuthPrompt(lastError);
    if (prompt) {
      setFeishuScopeAuthPrompt(prompt);
      if (lastSyncErrorMessage !== prompt.message) {
        toast.error(`需要补充飞书权限：${prompt.message}`);
        setLastSyncErrorMessage(prompt.message);
      }
      return;
    }

    const message = lastError instanceof Error ? lastError.message : '同步最新数据失败';
    if (lastSyncErrorMessage !== message) {
      toast.error(`同步最新数据失败：${message}`);
      setLastSyncErrorMessage(message);
    }
  }, [lastError, lastSyncErrorMessage]);

  const handleLogin = async (password: string) => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      const response = await api.login(password);
      writeStorageItem(TOKEN_KEY, response.token);
      setToken(response.token);
      successToast('登录成功');
    } catch (loginError) {
      setAuthError(loginError instanceof Error ? loginError.message : '登录失败');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveBookmark = async (payload: BookmarkPayload, id?: string) => {
    try {
      if (id) {
        await updateBookmark(id, payload);
        successToast(`书签已更新：${payload.title || payload.url}`);
        return;
      }

      await createBookmark(payload);
      successToast(`书签已添加：${payload.title || payload.url}`);
    } catch (saveError) {
      const prompt = buildFeishuScopeAuthPrompt(saveError);
      if (prompt) {
        setFeishuScopeAuthPrompt(prompt);
        toast.error(`需要补充飞书权限：${prompt.message}`);
        throw new Error(prompt.message);
      }
      showErrorToast(id ? '更新书签失败' : '添加书签失败', saveError);
      throw saveError;
    }
  };

  const handleDeleteBookmark = async (bookmark: Bookmark) => {
    setConfirmDialog({
      title: '删除书签',
      message: `确认删除「${bookmark.title}」吗？\n这个操作无法撤销。`,
      confirmLabel: '删除书签',
      danger: true,
      onConfirm: async () => {
        try {
          await deleteBookmark(bookmark.id);
          const nextRecent = recentIds.filter((id) => id !== bookmark.id);
          setRecentIds(nextRecent);
          writeStringArray(RECENT_KEY, nextRecent);
          successToast(`书签已删除：${bookmark.title}`);
        } catch (deleteError) {
          if (showFeishuScopePrompt(deleteError)) {
            return;
          }
          showErrorToast('删除书签失败', deleteError);
        }
      }
    });
  };

  const handleOpenBookmark = (bookmark: Bookmark) => {
    const nextRecent = [bookmark.id, ...recentIds.filter((id) => id !== bookmark.id)].slice(0, RECENT_LIMIT);
    setRecentIds(nextRecent);
    writeStringArray(RECENT_KEY, nextRecent);
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  const handleTogglePin = async (bookmark: Bookmark) => {
    const nextPinned = !bookmark.pinned;
    try {
      await updateBookmarkPin(bookmark.id, nextPinned);
      successToast(nextPinned ? `已置顶：${bookmark.title}` : `已取消置顶：${bookmark.title}`);
    } catch (pinError) {
      if (showFeishuScopePrompt(pinError)) return;
      showErrorToast(nextPinned ? '置顶失败' : '取消置顶失败', pinError);
    }
  };

  const handleThemeChange = (nextTheme: ThemePreference) => {
    setThemePreference(nextTheme);
    writeStorageItem(THEME_KEY, nextTheme);
  };

  const handleLogout = () => {
    removeStorageItem(TOKEN_KEY);
    setToken(null);
    setAuthError(null);
    infoToast('已退出登录');
  };

  const runRepairOrdering = async () => {
    if (!token || repairing) return;

    setRepairing(true);
    const loadingToastId = toast.loading('正在修复排序…');
    try {
      const result = await api.repairBookmarks(token);
      if (result.repaired === 0) {
        toast.success(`${result.totalRecords} 条书签的分类排序都正确。`, { id: loadingToastId });
      } else {
        toast.success(`排序修复完成：扫描 ${result.totalRecords} 条，更新 ${result.repaired} 条，覆盖 ${result.categoryCount} 个分类。`, { id: loadingToastId });
      }
      // Pull the corrected data back into the UI.
      dataWorkerClient.refresh();
    } catch (e) {
      toast.dismiss(loadingToastId);
      if (showFeishuScopePrompt(e)) return;
      showErrorToast('修复排序失败', e);
    } finally {
      setRepairing(false);
    }
  };

  const handleRepairOrdering = async () => {
    if (!token || repairing) return;
    setConfirmDialog({
      title: '修复分类排序',
      message: '将检查并修复所有书签的分类排序，使 tab 顺序与分组顺序一致。',
      confirmLabel: '开始修复',
      onConfirm: runRepairOrdering
    });
  };

  if (!token) {
    return (
      <>
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-[var(--text-muted)]">加载登录…</div>}>
          <LoginPage onSubmit={handleLogin} loading={authLoading} error={authError} />
        </Suspense>
        <Toaster position="top-center" toastOptions={hotToastOptions} />
      </>
    );
  }

  return (
    <div className="min-h-screen text-[var(--text-main)]">
      <div className="fixed inset-0 -z-10" style={{ background: 'var(--app-bg)' }} />

      <main className="mx-auto flex min-h-screen max-w-[1400px] flex-col px-3 py-4 pb-8 sm:px-6 sm:py-8 sm:pb-8 xl:px-10">
        <header className="p-1 sm:p-2 lg:p-3">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--accent-strong)] sm:text-sm sm:tracking-[0.35em]">
                Agent-first panel
              </p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <h1
                    className="text-[36px] leading-none text-[var(--text-main)] sm:text-5xl lg:text-6xl"
                    style={{ fontFamily: 'Instrument Serif, serif' }}
                  >
                    AIPanel
                  </h1>
                  {/* <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[#b4b8b1] sm:mt-4 sm:text-sm sm:leading-6 lg:text-[15px]">
                    先打开你最常用的入口，再从分组流里往下浏览。
                  </p> */}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingBookmark(null);
                    setModalOpen(true);
                  }}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--text-main)] transition duration-200 hover:opacity-90 sm:hidden"
                  aria-label="添加书签"
                  title="添加书签"
                >
                  <BookmarkPlus className="h-5 w-5 shrink-0" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <div className="inline-flex items-center rounded-full bg-[var(--surface-subtle)] p-1">
                {themeOptions.map(({ value, label, icon: Icon }) => {
                  const active = themePreference === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleThemeChange(value)}
                      title={label}
                      aria-label={label}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition duration-200 ${
                        active
                          ? 'bg-[var(--surface-chip-active)] text-[var(--text-main)]'
                          : 'text-[var(--text-muted)] hover:bg-[var(--surface-chip-hover)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingBookmark(null);
                  setModalOpen(true);
                }}
                title="添加书签"
                aria-label="添加书签"
                className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] bg-[var(--accent-soft)] text-[var(--text-main)] transition duration-200 hover:opacity-90"
              >
                <BookmarkPlus className="h-5 w-5 shrink-0" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                title="退出登录"
                aria-label="退出登录"
                className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] bg-[var(--surface-subtle)] text-[var(--text-strong)] transition duration-200 hover:bg-[var(--surface-subtle-hover)]"
              >
                <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2.5 sm:mt-6 sm:space-y-3">
            <div className="flex sm:hidden">
              <div className="inline-flex items-center rounded-full bg-[var(--surface-subtle)] p-1">
                {themeOptions.map(({ value, label, icon: Icon }) => {
                  const active = themePreference === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleThemeChange(value)}
                      title={label}
                      aria-label={label}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition duration-200 ${
                        active
                          ? 'bg-[var(--surface-chip-active)] text-[var(--text-main)]'
                          : 'text-[var(--text-muted)] hover:bg-[var(--surface-chip-hover)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
              <SearchBar value={search} onChange={setSearch} />
              <div className="hidden rounded-[10px] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text-muted)] lg:flex lg:items-center lg:justify-between">
                <span>总书签</span>
                <span className="text-base text-[var(--text-main)]">{bookmarks.length}</span>
              </div>
            </div>
            <CategoryTabs
              tabs={allTabs}
              activeTab={category}
              onChange={setCategory}
              onReorder={updateCategoryOrder}
              onCreateCategory={createCategory}
              onToast={({ tone, title, message }) => {
                const text = message ? `${title}：${message}` : title;
                if (tone === 'error') toast.error(text);
                else if (tone === 'success') toast.success(text);
                else toast(text);
              }}
            />
          </div>
        </header>

        <section className="mt-4 flex-1 space-y-3.5 md:mt-6 md:space-y-4.5">
          {pinnedBookmarks.length > 0 ? (
            <section className="p-2 md:p-2.5 lg:p-3">
              <SectionHeader title="置顶入口" subtitle="最常用的站点，始终排在前面。" />
              <BookmarkGrid
                bookmarks={pinnedBookmarks}
                loading={loading}
                error={error}
                onOpen={handleOpenBookmark}
                onTogglePin={handleTogglePin}
                onEdit={(bookmark) => {
                  setEditingBookmark(bookmark);
                  setModalOpen(true);
                }}
                onDelete={handleDeleteBookmark}
              />
            </section>
          ) : null}

          {isFlowMode && recentBookmarks.length > 0 ? (
            <section className="p-2 md:p-2.5 lg:p-3">
              <SectionHeader title="最近访问" subtitle="你最近点开过的站点，方便回跳。" />
              <BookmarkGrid
                bookmarks={recentBookmarks}
                loading={loading}
                error={error}
                onOpen={handleOpenBookmark}
                onTogglePin={handleTogglePin}
                onEdit={(bookmark) => {
                  setEditingBookmark(bookmark);
                  setModalOpen(true);
                }}
                onDelete={handleDeleteBookmark}
              />
            </section>
          ) : null}

          {isFlowMode ? (
            groupedBookmarks.map((group) => (
              <section key={group.name} className="p-2 md:p-2.5 lg:p-3">
                <SectionHeader title={group.name} subtitle={`${group.items.length} 个入口`} />
                <BookmarkGrid
                  bookmarks={group.items}
                  loading={loading}
                  error={error}
                  onOpen={handleOpenBookmark}
                  onTogglePin={handleTogglePin}
                  onEdit={(bookmark) => {
                    setEditingBookmark(bookmark);
                    setModalOpen(true);
                  }}
                  onDelete={handleDeleteBookmark}
                />
              </section>
            ))
          ) : (
            <section className="p-2 md:p-2.5 lg:p-3">
              <SectionHeader
                title={search.trim() ? '搜索结果' : category}
                subtitle={search.trim() ? `关键词：${search}` : '当前分组'}
              />
              <BookmarkGrid
                bookmarks={filteredBookmarks}
                loading={loading}
                error={error}
                onOpen={handleOpenBookmark}
                onTogglePin={handleTogglePin}
                onEdit={(bookmark) => {
                  setEditingBookmark(bookmark);
                  setModalOpen(true);
                }}
                onDelete={handleDeleteBookmark}
                emptyText={search.trim() ? '没搜到结果，试试别的关键词。' : '这个分组里还没有内容。'}
              />
            </section>
          )}
        </section>

        <footer className="mt-8 border-t border-[var(--border-subtle)] px-2 pt-5 pb-2 md:mt-10 md:px-4 md:pt-6" style={{ borderTopWidth: '0.5px' }}>
          <div className="flex flex-col gap-4 text-sm text-[var(--text-muted)] md:flex-row md:items-end md:justify-between">
            <div className="space-y-1.5">
              <p className="text-sm font-medium tracking-[0.02em] text-[var(--text-strong)] md:text-[15px]">AIPanel</p>
              <p className="max-w-[42rem] text-xs leading-5 text-[var(--text-soft)] md:text-sm">
                你的个人工作流入口面板，支持分类整理、搜索、拖拽排序与快速维护。
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 text-xs md:items-end md:text-sm">
              <div className="flex flex-wrap items-center gap-2.5 md:justify-end">
                {DATA_SOURCE_URL ? (
                  <a
                    href={DATA_SOURCE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-subtle)] px-3 py-1.5 text-[var(--text-strong)] transition duration-200 hover:bg-[var(--surface-subtle-hover)] hover:text-[var(--text-main)]"
                  >
                    <Database className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>数据源</span>
                  </a>
                ) : null}
                <a
                  href="https://github.com/simmzl/AIPanel"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-subtle)] px-3 py-1.5 text-[var(--text-strong)] transition duration-200 hover:bg-[var(--surface-subtle-hover)] hover:text-[var(--text-main)]"
                >
                  <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>GitHub</span>
                </a>
                <button
                  type="button"
                  onClick={handleRepairOrdering}
                  disabled={repairing}
                  title="检查并修复书签的分类排序"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-subtle)] px-3 py-1.5 text-[var(--text-strong)] transition duration-200 hover:bg-[var(--surface-subtle-hover)] hover:text-[var(--text-main)] disabled:cursor-wait disabled:opacity-60"
                >
                  <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{repairing ? '修复中…' : '修复排序'}</span>
                </button>
              </div>
              <span className="text-[var(--text-soft)]">Powered by AIPanel</span>
            </div>
          </div>
        </footer>
      </main>

      <Toaster position="top-center" toastOptions={hotToastOptions} />
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />

      {(refreshing || mutating) ? (
        <div className="fixed bottom-5 right-5 z-40 rounded-full bg-[var(--panel-elevated)] px-3 py-2 text-xs text-[var(--text-strong)] shadow-[var(--shadow-strong)] backdrop-blur-xl">
          {mutating ? '正在保存变更…' : '正在同步最新数据…'}
        </div>
      ) : null}

      {showBackToTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-5 right-5 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--text-main)] shadow-[0_18px_40px_rgba(0,0,0,0.16)] backdrop-blur-xl transition duration-200 hover:bg-[var(--surface-subtle-hover)] md:hidden"
          aria-label="回到顶部"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
            <path d="m5.5 11.5 4.5-4.5 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}


      {feishuScopeAuthPrompt ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[16px] bg-[var(--panel-elevated)] p-5 shadow-[var(--shadow-strong)] md:p-6">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--accent-strong)] md:text-sm md:tracking-[0.3em]">Feishu 授权提示</p>
            <h2 className="mt-2 text-[28px] leading-none text-[var(--text-main)]" style={{ fontFamily: 'Instrument Serif, serif' }}>
              需要补充飞书权限
            </h2>
            <p className="mt-4 text-sm leading-6 text-[var(--text-muted)] whitespace-pre-wrap break-words">
              {feishuScopeAuthPrompt.rawMessage || feishuScopeAuthPrompt.message}
            </p>
            {feishuScopeAuthPrompt.permissionViolations && feishuScopeAuthPrompt.permissionViolations.length > 0 ? (
              <div className="mt-4 rounded-[12px] bg-[var(--surface-subtle)] p-4 text-sm text-[var(--text-strong)]">
                <p className="mb-2 text-[var(--text-main)]">缺少的权限：</p>
                <ul className="space-y-1 text-[var(--text-muted)]">
                  {feishuScopeAuthPrompt.permissionViolations.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {feishuScopeAuthPrompt.authorizationUrl ? (
              <div className="mt-4 rounded-[12px] bg-[var(--surface-subtle)] p-4">
                <p className="text-sm text-[var(--text-main)]">授权链接</p>
                <p className="mt-2 break-all text-xs leading-5 text-[var(--text-muted)]">{feishuScopeAuthPrompt.authorizationUrl}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={feishuScopeAuthPrompt.authorizationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-[10px] bg-[var(--button-primary)] px-4 py-2.5 text-sm font-medium text-[var(--text-main)] transition duration-200 hover:bg-[var(--button-primary-hover)]"
                  >
                    去授权
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(feishuScopeAuthPrompt.authorizationUrl || '');
                        successToast('授权链接已复制');
                      } catch (copyError) {
                        showErrorToast('复制失败，请手动复制链接', copyError);
                      }
                    }}
                    className="inline-flex items-center rounded-[10px] bg-[var(--button-secondary)] px-4 py-2.5 text-sm text-[var(--text-main)] transition duration-200 hover:bg-[var(--button-secondary-hover)]"
                  >
                    复制链接
                  </button>
                </div>
              </div>
            ) : null}
            {feishuScopeAuthPrompt.requestId ? (
              <p className="mt-4 text-xs text-[var(--text-soft)]">Request ID: {feishuScopeAuthPrompt.requestId}</p>
            ) : null}
            <p className="mt-4 text-xs leading-5 text-[var(--text-soft)]">授权成功后，刷新本页面即可继续使用。</p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setFeishuScopeAuthPrompt(null)}
                className="rounded-[10px] bg-[var(--button-ghost)] px-4 py-2.5 text-sm text-[var(--text-strong)] transition duration-200 hover:bg-[var(--button-ghost-hover)]"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modalOpen ? (
        <Suspense fallback={null}>
          <AddBookmark
            open={modalOpen}
            token={token}
            categories={categories}
            initialBookmark={editingBookmark}
            onClose={() => {
              setModalOpen(false);
              setEditingBookmark(null);
            }}
            onSubmit={handleSaveBookmark}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
