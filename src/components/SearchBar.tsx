interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <label className="relative block">
      <span className="sr-only">搜索书签</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="搜索网站、描述、链接或分组"
        className="w-full rounded-[10px] bg-[var(--surface-input)] px-4 py-3.5 pl-11 text-sm text-[var(--text-main)] placeholder:text-[var(--text-soft)] outline-none transition duration-200 focus:bg-[var(--surface-input-focus)] focus:ring-2 focus:ring-[var(--accent-soft)]"
      />
      <svg
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-soft)]"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="m14.5 14.5 4 4m-1.333-9.166a7.833 7.833 0 1 1-15.667 0 7.833 7.833 0 0 1 15.667 0Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </label>
  );
}
