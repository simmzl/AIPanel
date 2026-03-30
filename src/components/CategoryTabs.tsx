import { useEffect, useMemo, useState, type DragEvent, type KeyboardEvent } from 'react';
import { readMigratedStorageItem, writeStorageItem } from '../utils/localStorage';

const STORAGE_KEY = 'category_order';

interface CategoryTabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  onReorder?: (tabs: string[]) => Promise<void> | void;
  onCreateCategory?: (name: string) => Promise<void> | void;
}

function readStoredOrder() {
  if (typeof window === 'undefined') return [] as string[];

  try {
    const raw = readMigratedStorageItem(STORAGE_KEY);
    if (!raw) return [] as string[];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [] as string[];
  }
}

function writeStoredOrder(order: string[]) {
  if (typeof window === 'undefined') return;

  try {
    writeStorageItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    // ignore
  }
}

function sortTabsByOrder(tabs: string[], storedOrder: string[]) {
  const baseTabs = tabs.filter((tab) => tab !== '全部');
  const known = storedOrder.filter((tab) => baseTabs.includes(tab));
  const missing = baseTabs.filter((tab) => !known.includes(tab));
  return ['全部', ...known, ...missing];
}

export function CategoryTabs({ tabs, activeTab, onChange, onReorder, onCreateCategory }: CategoryTabsProps) {
  const [storedOrder, setStoredOrder] = useState<string[]>(() => readStoredOrder());
  const [draggingTab, setDraggingTab] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const orderedTabs = useMemo(() => sortTabsByOrder(tabs, storedOrder), [tabs, storedOrder]);

  useEffect(() => {
    const normalized = sortTabsByOrder(tabs, storedOrder).filter((tab) => tab !== '全部');

    if (normalized.join('|') !== storedOrder.join('|')) {
      setStoredOrder(normalized);
      writeStoredOrder(normalized);
    }
  }, [tabs, storedOrder]);

  const moveTab = async (fromTab: string, toTab: string) => {
    if (fromTab === toTab || fromTab === '全部' || toTab === '全部') return;

    const current = orderedTabs.filter((tab) => tab !== '全部');
    const fromIndex = current.indexOf(fromTab);
    const toIndex = current.indexOf(toTab);

    if (fromIndex < 0 || toIndex < 0) return;

    const next = [...current];
    next.splice(fromIndex, 1);
    next.splice(toIndex, 0, fromTab);
    const previous = storedOrder;

    setStoredOrder(next);
    writeStoredOrder(next);

    if (!onReorder) return;

    try {
      setSavingOrder(true);
      await onReorder(next);
    } catch (error) {
      setStoredOrder(previous);
      writeStoredOrder(previous);
      window.alert(error instanceof Error ? error.message : '分类排序保存失败');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDrop = async (targetTab: string) => {
    if (!draggingTab) return;
    const source = draggingTab;
    setDraggingTab(null);
    await moveTab(source, targetTab);
  };

  const handleCreateCategory = async () => {
    const name = newCategory.trim();
    if (!name) {
      window.alert('分类名称不能为空');
      return;
    }

    if (tabs.includes(name)) {
      window.alert('这个分类已经存在了');
      return;
    }

    try {
      setSavingOrder(true);
      await onCreateCategory?.(name);
      const next = [...storedOrder.filter(Boolean), name];
      setStoredOrder(next);
      writeStoredOrder(next);
      setNewCategory('');
      setAddingCategory(false);
      onChange(name);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '新建分类失败');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleCreateCategory();
    }
    if (event.key === 'Escape') {
      setAddingCategory(false);
      setNewCategory('');
    }
  };

  return (
    <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max items-center gap-2 px-1">
        {orderedTabs.map((tab) => {
          const active = tab === activeTab;
          const draggable = tab !== '全部' && !savingOrder;

          return (
            <button
              key={tab}
              type="button"
              draggable={draggable}
              onClick={() => onChange(tab)}
              onDragStart={() => setDraggingTab(tab)}
              onDragEnd={() => setDraggingTab(null)}
              onDragOver={(event) => {
                if (!draggingTab || draggingTab === tab || tab === '全部') return;
                event.preventDefault();
              }}
              onDrop={(event: DragEvent<HTMLButtonElement>) => {
                event.preventDefault();
                void handleDrop(tab);
              }}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] transition duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] md:px-4 md:text-sm ${
                active
                  ? 'bg-[var(--surface-chip-active)] text-[var(--text-main)]'
                  : 'bg-[var(--surface-chip)] text-[var(--text-muted)] hover:bg-[var(--surface-chip-hover)] hover:text-[var(--text-main)]'
              } ${draggingTab === tab || savingOrder ? 'opacity-60' : ''}`}
              title={draggable ? '桌面端支持拖拽排序' : savingOrder ? '正在保存排序' : undefined}
            >
              {tab}
            </button>
          );
        })}

        {addingCategory ? (
          <div className="flex items-center gap-2 rounded-full bg-[var(--surface-subtle)] px-2 py-1.5">
            <input
              autoFocus
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="新分类"
              className="w-24 bg-transparent px-2 text-[13px] text-[var(--text-main)] outline-none placeholder:text-[var(--text-soft)] md:w-28 md:text-sm"
            />
            <button
              type="button"
              onClick={() => void handleCreateCategory()}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-chip-active)] text-[var(--text-main)]"
              title="保存分类"
            >
              ✓
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingCategory(true)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-chip)] text-lg text-[var(--text-main)] transition duration-200 hover:bg-[var(--surface-chip-hover)]"
            title="新建分类"
            aria-label="新建分类"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
