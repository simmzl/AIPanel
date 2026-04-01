import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AddBookmark } from './components/AddBookmark';
import { BookmarkGrid } from './components/BookmarkGrid';
import { CategoryTabs } from './components/CategoryTabs';
import { LoginPage } from './components/LoginPage';
import { SearchBar } from './components/SearchBar';
import { useBookmarks } from './hooks/useBookmarks';
import { ApiError, api } from './services/api';
import type { Bookmark, BookmarkPayload } from './types';
import { readMigratedStorageItem, removeStorageItem, writeStorageItem } from './utils/localStorage';

const TOKEN_KEY = 'token';
const PINNED_KEY = 'pinned_ids';
const RECENT_KEY = 'recent_ids';
const THEME_KEY = 'theme_preference';
const RECENT_LIMIT = 12;
const DATA_SOURCE_URL = __AIPANEL_FEISHU_BITABLE_SOURCE_URL__;

type ThemePreference = 'system' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

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
  const [token, setToken] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [feishuScopeAuthPrompt, setFeishuScopeAuthPrompt] = useState<FeishuScopeAuthPrompt | null>(null);

  useEffect(() => {
    const storedToken = readMigratedStorageItem(TOKEN_KEY);
    setPinnedIds(readStringArray(PINNED_KEY));
    setRecentIds(readStringArray(RECENT_KEY));
    setThemePreference(getStoredThemePreference());

    if (!storedToken) {
      setAuthReady(true);
      return;
    }

    void (async () => {
      try {
        await api.verifyToken(storedToken);
        setToken(storedToken);
      } catch {
        removeStorageItem(TOKEN_KEY);
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  const { bookmarks, filteredBookmarks, categories, loading, refreshing, mutating, error, lastError, createBookmark, updateBookmark, deleteBookmark, updateCategoryOrder, createCategory } = useBookmarks({
    token,
    search,
    category
  });

  const resolvedTheme: ResolvedTheme = themePreference === 'system' ? systemTheme : themePreference;
  const allTabs = useMemo(() => ['全部', ...categories], [categories]);

  useEffect(() => {
    if (category !== '全部' && !categories.includes(category)) {
      setCategory('全部');
    }
  }, [categories, category]);

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

  const pinnedBookmarks = useMemo(() => {
    const map = new Map(bookmarks.map((item) => [item.id, item]));
    return pinnedIds.map((id) => map.get(id)).filter((item): item is Bookmark => Boolean(item));
  }, [bookmarks, pinnedIds]);

  const recentBookmarks = useMemo(() => {
    const map = new Map(bookmarks.map((item) => [item.id, item]));
    return recentIds
      .filter((id) => !pinnedIds.includes(id))
      .map((id) => map.get(id))
      .filter((item): item is Bookmark => Boolean(item));
  }, [bookmarks, recentIds, pinnedIds]);

  const groupedBookmarks = useMemo(() => {
    const source = search.trim() || category !== '全部' ? filteredBookmarks : bookmarks;
    const groups = new Map<string, Bookmark[]>();

    for (const bookmark of source) {
      if (pinnedIds.includes(bookmark.id)) continue;

      const key = bookmark.category || '其他';
      const list = groups.get(key) ?? [];
      list.push(bookmark);
      groups.set(key, list);
    }

    return Array.from(groups.entries()).map(([name, items]) => ({
      name,
      items: sortByCategoryAndOrder(items)
    }));
  }, [bookmarks, filteredBookmarks, search, category, pinnedIds, recentIds]);

  const isFlowMode = search.trim() === '' && category === '全部';

  useEffect(() => {
    const prompt = buildFeishuScopeAuthPrompt(lastError);
    if (prompt) {
      setFeishuScopeAuthPrompt(prompt);
    }
  }, [lastError]);

  const handleLogin = async (password: string) => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      const response = await api.login(password);
      writeStorageItem(TOKEN_KEY, response.token);
      setToken(response.token);
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
        return;
      }

      await createBookmark(payload);
    } catch (saveError) {
      const prompt = buildFeishuScopeAuthPrompt(saveError);
      if (prompt) {
        setFeishuScopeAuthPrompt(prompt);
        throw new Error(prompt.message);
      }
      throw saveError;
    }
  };

  const handleDeleteBookmark = async (bookmark: Bookmark) => {
    const confirmed = window.confirm(`确认删除「${bookmark.title}」吗？`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteBookmark(bookmark.id);
      const nextPinned = pinnedIds.filter((id) => id !== bookmark.id);
      const nextRecent = recentIds.filter((id) => id !== bookmark.id);
      setPinnedIds(nextPinned);
      setRecentIds(nextRecent);
      writeStringArray(PINNED_KEY, nextPinned);
      writeStringArray(RECENT_KEY, nextRecent);
    } catch (deleteError) {
      const prompt = buildFeishuScopeAuthPrompt(deleteError);
      if (prompt) {
        setFeishuScopeAuthPrompt(prompt);
        return;
      }
      window.alert(deleteError instanceof Error ? deleteError.message : '删除失败');
    }
  };

  const handleOpenBookmark = (bookmark: Bookmark) => {
    const nextRecent = [bookmark.id, ...recentIds.filter((id) => id !== bookmark.id)].slice(0, RECENT_LIMIT);
    setRecentIds(nextRecent);
    writeStringArray(RECENT_KEY, nextRecent);
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  const handleTogglePin = (bookmark: Bookmark) => {
    const nextPinned = pinnedIds.includes(bookmark.id)
      ? pinnedIds.filter((id) => id !== bookmark.id)
      : [bookmark.id, ...pinnedIds.filter((id) => id !== bookmark.id)];

    setPinnedIds(nextPinned);
    writeStringArray(PINNED_KEY, nextPinned);
  };

  const handleThemeChange = (nextTheme: ThemePreference) => {
    setThemePreference(nextTheme);
    writeStorageItem(THEME_KEY, nextTheme);
  };

  const handleLogout = () => {
    removeStorageItem(TOKEN_KEY);
    setToken(null);
    setAuthError(null);
  };

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center text-white">验证中...</div>;
  }

  if (!token) {
    return <LoginPage onSubmit={handleLogin} loading={authLoading} error={authError} />;
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
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xl text-[var(--text-main)] transition duration-200 hover:opacity-90 sm:hidden"
                  aria-label="添加书签"
                >
                  +
                </button>
              </div>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <div className="inline-flex items-center rounded-full bg-[var(--surface-subtle)] p-1">
                {([
                  ['system', '跟随系统'],
                  ['light', '浅色'],
                  ['dark', '深色']
                ] as const).map(([value, label]) => {
                  const active = themePreference === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleThemeChange(value)}
                      className={`rounded-full px-3 py-2 text-xs transition duration-200 ${
                        active
                          ? 'bg-[var(--surface-chip-active)] text-[var(--text-main)]'
                          : 'text-[var(--text-muted)] hover:bg-[var(--surface-chip-hover)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {label}
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
                className="rounded-[10px] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--text-main)] transition duration-200 hover:opacity-90"
              >
                添加书签
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-[10px] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text-strong)] transition duration-200 hover:bg-[var(--surface-subtle-hover)]"
              >
                退出登录
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-3 sm:mt-8 sm:space-y-4">
            <div className="flex sm:hidden">
              <div className="inline-flex items-center rounded-full bg-[var(--surface-subtle)] p-1">
                {([
                  ['system', '系统'],
                  ['light', '浅色'],
                  ['dark', '深色']
                ] as const).map(([value, label]) => {
                  const active = themePreference === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleThemeChange(value)}
                      className={`rounded-full px-3 py-2 text-xs transition duration-200 ${
                        active
                          ? 'bg-[var(--surface-chip-active)] text-[var(--text-main)]'
                          : 'text-[var(--text-muted)] hover:bg-[var(--surface-chip-hover)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {label}
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
            <CategoryTabs tabs={allTabs} activeTab={category} onChange={setCategory} onReorder={updateCategoryOrder} onCreateCategory={createCategory} />
          </div>
        </header>

        <section className="mt-6 flex-1 space-y-5 md:mt-8 md:space-y-6">
          {pinnedBookmarks.length > 0 ? (
            <section className="p-2 md:p-3 lg:p-4">
              <SectionHeader title="置顶入口" subtitle="最常用的站点，始终排在前面。" />
              <BookmarkGrid
                bookmarks={pinnedBookmarks}
                pinnedIds={pinnedIds}
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
            <section className="p-2 md:p-3 lg:p-4">
              <SectionHeader title="最近访问" subtitle="你最近点开过的站点，方便回跳。" />
              <BookmarkGrid
                bookmarks={recentBookmarks}
                pinnedIds={pinnedIds}
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
              <section key={group.name} className="p-2 md:p-3 lg:p-4">
                <SectionHeader title={group.name} subtitle={`${group.items.length} 个入口`} />
                <BookmarkGrid
                  bookmarks={group.items}
                  pinnedIds={pinnedIds}
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
            <section className="p-2 md:p-3 lg:p-4">
              <SectionHeader
                title={search.trim() ? '搜索结果' : category}
                subtitle={search.trim() ? `关键词：${search}` : '当前分组'}
              />
              <BookmarkGrid
                bookmarks={filteredBookmarks}
                pinnedIds={pinnedIds}
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

        <footer className="mt-10 border-t border-[var(--border-subtle)] px-2 pt-6 pb-2 md:mt-14 md:px-4 md:pt-8" style={{ borderTopWidth: '0.5px' }}>
          <div className="flex flex-col gap-4 text-sm text-[var(--text-muted)] md:flex-row md:items-end md:justify-between">
            <div className="space-y-1.5">
              <p className="text-sm font-medium tracking-[0.02em] text-[var(--text-strong)] md:text-[15px]">AIPanel</p>
              <p className="max-w-[42rem] text-xs leading-5 text-[var(--text-soft)] md:text-sm">
                你的个人工作流入口面板，支持分类整理、搜索、拖拽排序与快速维护。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 text-xs md:justify-end md:text-sm">
              {DATA_SOURCE_URL ? (
                <a
                  href={DATA_SOURCE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full bg-[var(--surface-subtle)] px-3 py-1.5 text-[var(--text-strong)] transition duration-200 hover:bg-[var(--surface-subtle-hover)] hover:text-[var(--text-main)]"
                >
                  数据源
                </a>
              ) : null}
              <a
                href="https://github.com/simmzl/AIPanel"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-subtle)] px-3 py-1.5 text-[var(--text-strong)] transition duration-200 hover:bg-[var(--surface-subtle-hover)] hover:text-[var(--text-main)]"
              >
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                  <path d="M10 1.7a8.3 8.3 0 0 0-2.62 16.18c.42.08.57-.18.57-.4l-.01-1.55c-2.33.5-2.82-.99-2.82-.99-.38-.95-.93-1.2-.93-1.2-.76-.52.06-.51.06-.51.84.06 1.29.86 1.29.86.75 1.28 1.96.91 2.44.69.08-.54.29-.91.53-1.12-1.86-.21-3.81-.93-3.81-4.14 0-.91.33-1.65.86-2.23-.08-.21-.37-1.05.08-2.18 0 0 .7-.22 2.3.85A7.92 7.92 0 0 1 10 5.73c.71 0 1.43.1 2.1.3 1.6-1.07 2.3-.85 2.3-.85.45 1.13.16 1.97.08 2.18.54.58.86 1.32.86 2.23 0 3.22-1.95 3.92-3.82 4.13.3.26.57.78.57 1.57l-.01 2.32c0 .22.15.48.58.4A8.3 8.3 0 0 0 10 1.7Z" />
                </svg>
                <span>GitHub</span>
              </a>
              <span className="text-[var(--text-soft)]">Powered by AIPanel</span>
            </div>
          </div>
        </footer>
      </main>

      {(refreshing || mutating) ? (
        <div className="fixed bottom-5 right-5 z-40 rounded-full bg-[var(--panel-elevated)] px-3 py-2 text-xs text-[var(--text-strong)] shadow-[var(--shadow-strong)] backdrop-blur-xl">
          {mutating ? '正在保存变更…' : '正在同步最新数据…'}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          setEditingBookmark(null);
          setModalOpen(true);
        }}
        className={`fixed right-5 z-30 hidden h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-3xl text-[var(--text-main)] shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl transition duration-200 hover:scale-[1.03] hover:opacity-90 md:flex ${(refreshing || mutating) ? 'bottom-20' : 'bottom-5'}`}
        aria-label="添加书签"
      >
        +
      </button>

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
            <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
              {feishuScopeAuthPrompt.message}
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
                        window.alert('授权链接已复制');
                      } catch {
                        window.alert('复制失败，请手动复制链接');
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
    </div>
  );
}
