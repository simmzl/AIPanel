import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AddBookmark } from './components/AddBookmark';
import { BookmarkGrid } from './components/BookmarkGrid';
import { CategoryTabs } from './components/CategoryTabs';
import { LoginPage } from './components/LoginPage';
import { SearchBar } from './components/SearchBar';
import { useBookmarks } from './hooks/useBookmarks';
import { api } from './services/api';
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

  const { bookmarks, filteredBookmarks, categories, loading, refreshing, mutating, error, createBookmark, updateBookmark, deleteBookmark, updateCategoryOrder, createCategory } = useBookmarks({
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
    if (id) {
      await updateBookmark(id, payload);
      return;
    }

    await createBookmark(payload);
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
          <div className="flex flex-col gap-3 text-sm text-[var(--text-muted)] md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[var(--text-strong)]">AIPanel</p>
              <p className="mt-1 text-xs md:text-sm">你的 AIPanel 入口面板，支持分类整理、搜索、拖拽排序与快速维护。</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm">
              {DATA_SOURCE_URL ? (
                <a
                  href={DATA_SOURCE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 transition duration-200 hover:text-[var(--text-main)]"
                >
                  数据源
                </a>
              ) : null}
              <span className="text-[var(--text-soft)]">面向个人工作流的轻量书签面板</span>
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
