import { FormEvent, useMemo, useState } from 'react';

function clearPasswordParamsFromUrl() {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  const hadPasswordParam = ['password', 'pwd', 'pass'].some((key) => url.searchParams.has(key));

  if (!hadPasswordParam) {
    return;
  }

  url.searchParams.delete('password');
  url.searchParams.delete('pwd');
  url.searchParams.delete('pass');

  const nextSearch = url.searchParams.toString();
  const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`;
  window.history.replaceState({}, document.title, nextUrl);
}

interface LoginPageProps {
  onSubmit: (password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function LoginPage({ onSubmit, loading, error }: LoginPageProps) {
  const initialPassword = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    const params = new URLSearchParams(window.location.search);
    return params.get('password') ?? params.get('pwd') ?? params.get('pass') ?? '';
  }, []);

  const [password, setPassword] = useState(initialPassword);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(password);
    clearPasswordParamsFromUrl();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12 text-[var(--text-main)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(93,183,173,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(87,146,173,0.1),_transparent_24%)]" />
      <div className="absolute left-8 top-14 h-40 w-40 rounded-full bg-emerald-300/10 blur-3xl" />
      <div className="absolute bottom-8 right-8 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md rounded-[14px] bg-[var(--panel-card)] p-8 shadow-[var(--shadow-strong)] backdrop-blur-xl"
      >
        <p className="text-sm uppercase tracking-[0.35em] text-[var(--accent-strong)]">Private panel</p>
        <h1 className="mt-4 text-4xl leading-none text-[var(--text-main)]" style={{ fontFamily: 'Instrument Serif, serif' }}>
          Welcome back.
        </h1>
        <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
          输入访问密码后继续。验证成功后会在本地保存登录状态，方便你下次直接进入。
        </p>

        <label className="mt-8 block text-sm text-[var(--text-strong)]">
          访问密码
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="输入密码"
            className="mt-3 w-full rounded-[10px] bg-[var(--surface-input)] px-4 py-3.5 text-[var(--text-main)] outline-none transition duration-200 focus:bg-[var(--surface-input-focus)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            autoFocus
          />
        </label>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center rounded-[10px] bg-[var(--accent-soft)] px-4 py-3.5 text-sm font-medium text-[var(--text-main)] transition duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? '正在验证密码' : '进入面板'}
        </button>
      </form>
    </div>
  );
}
