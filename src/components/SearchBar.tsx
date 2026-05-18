import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { readMigratedStorageItem, writeStorageItem } from '../utils/localStorage';

interface SearchEngine {
  id: 'google' | 'baidu' | 'bing';
  label: string;
  // {q} is the encoded query placeholder.
  urlTemplate: string;
  // Short hostname-style label shown on the toggle button.
  short: string;
}

const ENGINES: SearchEngine[] = [
  { id: 'google', label: 'Google', short: 'Google', urlTemplate: 'https://www.google.com/search?q={q}' },
  { id: 'baidu', label: '百度', short: '百度', urlTemplate: 'https://www.baidu.com/s?wd={q}' },
  // setmkt=en-US forces the international (non-cn) Bing experience.
  { id: 'bing', label: 'Bing 国际版', short: 'Bing', urlTemplate: 'https://www.bing.com/search?q={q}&cc=US&setmkt=en-US&setlang=en-US' }
];

const STORAGE_KEY = 'search_engine';

function readStoredEngine(): SearchEngine {
  try {
    const raw = readMigratedStorageItem(STORAGE_KEY);
    const found = ENGINES.find((e) => e.id === raw);
    if (found) return found;
  } catch {
    // ignore
  }
  return ENGINES[0];
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const [engine, setEngine] = useState<SearchEngine>(() => readStoredEngine());
  const [pickerOpen, setPickerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close the picker when clicking outside.
  useEffect(() => {
    if (!pickerOpen) return;

    const handlePointer = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && containerRef.current?.contains(target)) return;
      setPickerOpen(false);
    };
    document.addEventListener('pointerdown', handlePointer);
    return () => document.removeEventListener('pointerdown', handlePointer);
  }, [pickerOpen]);

  const selectEngine = (next: SearchEngine) => {
    setEngine(next);
    setPickerOpen(false);
    try {
      writeStorageItem(STORAGE_KEY, next.id);
    } catch {
      // ignore
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    const query = value.trim();
    if (!query) return;
    event.preventDefault();
    const url = engine.urlTemplate.replace('{q}', encodeURIComponent(query));
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="relative block">
        <span className="sr-only">搜索书签或网络</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`搜索书签，回车用 ${engine.label} 搜索`}
          className="w-full rounded-[10px] bg-[var(--surface-input)] py-3.5 pl-11 pr-[7.5rem] text-sm text-[var(--text-main)] placeholder:text-[var(--text-soft)] outline-none transition duration-200 focus:bg-[var(--surface-input-focus)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        />
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-soft)]"
        />
        <button
          type="button"
          onClick={() => setPickerOpen((open) => !open)}
          className="absolute right-1.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-[8px] bg-[var(--surface-chip)] px-2.5 py-1.5 text-xs text-[var(--text-strong)] outline-none transition duration-200 hover:bg-[var(--surface-chip-hover)]"
          aria-haspopup="listbox"
          aria-expanded={pickerOpen}
          aria-label={`当前搜索引擎：${engine.label}`}
        >
          <span>{engine.short}</span>
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        </button>
      </label>

      {pickerOpen ? (
        <div
          role="listbox"
          className="absolute right-0 top-full z-40 mt-2 min-w-[8.5rem] space-y-1 rounded-[10px] bg-[var(--panel-elevated)] p-1.5 shadow-[var(--shadow-strong)] backdrop-blur-xl"
        >
          {ENGINES.map((option) => {
            const active = option.id === engine.id;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => selectEngine(option)}
                className={`flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-left text-sm outline-none transition duration-150 ${
                  active
                    ? 'bg-[var(--surface-chip-active)] text-[var(--text-main)]'
                    : 'text-[var(--text-strong)] hover:bg-[var(--surface-chip-hover)] hover:text-[var(--text-main)]'
                }`}
              >
                <span>{option.label}</span>
                {active ? <span className="text-[var(--accent-strong)]">·</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
