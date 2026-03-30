import { FormEvent, useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Bookmark, BookmarkPayload, MetaResponse } from '../types';

interface AddBookmarkProps {
  open: boolean;
  token: string;
  categories: string[];
  initialBookmark?: Bookmark | null;
  onClose: () => void;
  onSubmit: (payload: BookmarkPayload, id?: string) => Promise<void>;
}

const emptyForm = {
  url: '',
  title: '',
  subtitle: '',
  favicon: '',
  category: '',
  order: 0
};

export function AddBookmark({
  open,
  token,
  categories,
  initialBookmark,
  onClose,
  onSubmit
}: AddBookmarkProps) {
  const [form, setForm] = useState(emptyForm);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (initialBookmark) {
      setForm({
        url: initialBookmark.url,
        title: initialBookmark.title,
        subtitle: initialBookmark.subtitle,
        favicon: initialBookmark.favicon,
        category: initialBookmark.category,
        order: initialBookmark.order
      });
      return;
    }

    setForm({ ...emptyForm, category: categories[0] || '其他' });
    setError(null);
  }, [initialBookmark, open, categories]);

  if (!open) {
    return null;
  }

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleFetchMeta = async () => {
    if (!form.url) {
      setError('请先输入 URL');
      return;
    }

    setLoadingMeta(true);
    setError(null);

    try {
      const meta: MetaResponse = await api.fetchMeta(form.url, token);
      setForm((current) => ({
        ...current,
        title: current.title || meta.title,
        subtitle: current.subtitle || meta.description,
        favicon: current.favicon || meta.favicon
      }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '抓取网站信息失败');
    } finally {
      setLoadingMeta(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(
        {
          url: form.url,
          title: form.title,
          subtitle: form.subtitle,
          favicon: form.favicon,
          category: form.category || '其他',
          order: Number(form.order) || 0
        },
        initialBookmark?.id
      );
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '保存书签失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-sm sm:p-4">
      <div className="w-full max-w-xl rounded-[16px] bg-[var(--panel-elevated)] p-4 shadow-[var(--shadow-strong)] sm:p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--accent-strong)] sm:text-sm sm:tracking-[0.3em]">Bookmark editor</p>
            <h2
              className="mt-2 text-[28px] leading-none text-[var(--text-main)] sm:text-3xl"
              style={{ fontFamily: 'Instrument Serif, serif' }}
            >
              {initialBookmark ? '编辑书签' : '添加书签'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[var(--button-ghost)] px-3 py-1.5 text-sm text-[var(--text-strong)] transition duration-200 hover:bg-[var(--button-ghost-hover)]"
          >
            关闭
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <label className="block text-sm text-[var(--text-strong)]">
              URL
              <input
                required
                type="text"
                value={form.url}
                onChange={(event) => updateField('url', event.target.value)}
                placeholder="example.com 或 https://example.com"
                className="mt-1.5 w-full rounded-[10px] bg-[var(--surface-input)] px-4 py-2.5 text-[var(--text-main)] outline-none transition duration-200 focus:bg-[var(--surface-input-focus)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
            </label>
            <button
              type="button"
              onClick={handleFetchMeta}
              disabled={loadingMeta}
              className="h-11 rounded-[10px] bg-[var(--button-secondary)] px-5 text-sm text-[var(--text-main)] transition duration-200 hover:bg-[var(--button-secondary-hover)] disabled:opacity-60"
            >
              {loadingMeta ? '正在抓取信息' : '自动抓取'}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm text-[var(--text-strong)]">
              标题
              <input
                value={form.title}
                onChange={(event) => updateField('title', event.target.value)}
                className="mt-1.5 w-full rounded-[10px] bg-[var(--surface-input)] px-4 py-2.5 text-[var(--text-main)] outline-none transition duration-200 focus:bg-[var(--surface-input-focus)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
            </label>
            <label className="block text-sm text-[var(--text-strong)]">
              分类
              <select
                value={form.category}
                onChange={(event) => updateField('category', event.target.value)}
                className="mt-1.5 w-full rounded-[10px] bg-[var(--surface-input)] px-4 py-2.5 text-[var(--text-main)] outline-none transition duration-200 focus:bg-[var(--surface-input-focus)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm text-[var(--text-strong)]">
            副标题
            <textarea
              value={form.subtitle}
              onChange={(event) => updateField('subtitle', event.target.value)}
              rows={2}
              className="mt-1.5 w-full rounded-[10px] bg-[var(--surface-input)] px-4 py-2.5 text-[var(--text-main)] outline-none transition duration-200 focus:bg-[var(--surface-input-focus)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm text-[var(--text-strong)]">
              图标 URL
              <input
                type="text"
                value={form.favicon}
                onChange={(event) => updateField('favicon', event.target.value)}
                className="mt-1.5 w-full rounded-[10px] bg-[var(--surface-input)] px-4 py-2.5 text-[var(--text-main)] outline-none transition duration-200 focus:bg-[var(--surface-input-focus)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
            </label>
            <label className="block text-sm text-[var(--text-strong)]">
              排序
              <input
                type="number"
                value={form.order}
                onChange={(event) => updateField('order', Number(event.target.value))}
                className="mt-1.5 w-full rounded-[10px] bg-[var(--surface-input)] px-4 py-2.5 text-[var(--text-main)] outline-none transition duration-200 focus:bg-[var(--surface-input-focus)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
            </label>
          </div>

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] bg-[var(--button-ghost)] px-4 py-2.5 text-sm text-[var(--text-strong)] transition duration-200 hover:bg-[var(--button-ghost-hover)]"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-[10px] bg-[var(--button-primary)] px-4 py-2.5 text-sm font-medium text-[var(--text-main)] transition duration-200 hover:bg-[var(--button-primary-hover)] disabled:opacity-60"
            >
              {submitting ? '正在保存' : initialBookmark ? '保存修改' : '保存书签'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
